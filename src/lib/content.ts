import { z } from "zod";
import { getCategory, TIER_INFO, type CategoryId, type Tier } from "./catalog";
import { DEFAULT_DRINKS } from "./drinks";

const DRINK_CATEGORIES: CategoryId[] = ["mariage", "dot", "anniversaire", "baby-shower", "bapteme", "autre"];

// Contenu d'une invitation : validé strictement côté serveur.
// Pas de HTML libre, pas de liens libres (liste blanche : cartes), photos hébergées chez nous uniquement.

const IMAGE_HOST_SUFFIX = process.env.ALLOWED_IMAGE_HOST_SUFFIX ?? ".public.blob.vercel-storage.com";

// Illustrations d'exemple fournies par Aliko Event (dossier /public/samples).
const SAMPLE_IMAGE = /^\/samples\/[a-z-]+\.svg$/;

export function isAllowedImageUrl(u: string): boolean {
  if (SAMPLE_IMAGE.test(u)) return true;
  try {
    const x = new URL(u);
    return x.protocol === "https:" && x.hostname.endsWith(IMAGE_HOST_SUFFIX);
  } catch {
    return false;
  }
}

const MAP_HOSTS = new Set([
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
  "www.openstreetmap.org",
  "openstreetmap.org",
  "waze.com",
  "www.waze.com",
  "ul.waze.com",
]);

export function isAllowedMapUrl(u: string): boolean {
  try {
    const x = new URL(u);
    if (x.protocol !== "https:") return false;
    if (MAP_HOSTS.has(x.hostname)) return true;
    return (x.hostname === "www.google.com" || x.hostname === "google.com") && x.pathname.startsWith("/maps");
  } catch {
    return false;
  }
}

const isoDate = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")]);
const hhmm = z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide")]);

export const contentSchema = z.object({
  eyebrow: z.string().trim().max(80).default(""),
  title: z.string().trim().min(1, "Le titre est obligatoire").max(80),
  subtitle: z.string().trim().max(120).default(""),
  date: isoDate.default(""),
  time: hhmm.default(""),
  venueName: z.string().trim().max(100).default(""),
  address: z.string().trim().max(200).default(""),
  mapUrl: z
    .string()
    .trim()
    .max(400)
    .refine((v) => v === "" || isAllowedMapUrl(v), "Lien de carte non autorisé (Google Maps, OpenStreetMap ou Waze uniquement)")
    .default(""),
  message: z.string().trim().max(600).default(""),
  dressCode: z.string().trim().max(80).default(""),
  contactPhone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s().-]*$/, "Numéro invalide")
    .default(""),
  program: z
    .array(z.object({ time: hhmm.default(""), label: z.string().trim().min(1).max(80) }))
    .max(12)
    .default([]),
  photos: z
    .array(z.string().max(500).refine(isAllowedImageUrl, "Photo non autorisée"))
    .max(12)
    .default([]),
  rsvpEnabled: z.boolean().default(true),
  rsvpDeadline: isoDate.default(""),
  guestbookEnabled: z.boolean().default(true),
  showMap: z.boolean().default(true),
  drinksEnabled: z.boolean().default(false),
  drinks: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
});

export type InvitationContent = z.infer<typeof contentSchema>;

export function sampleContent(categoryId: CategoryId, drinkDefaults: readonly string[] = DEFAULT_DRINKS): InvitationContent {
  const c = getCategory(categoryId);
  if (!c) throw new Error("Catégorie inconnue");
  return {
    eyebrow: c.eyebrow,
    title: c.sample.title,
    subtitle: c.sample.subtitle,
    date: "",
    time: c.sample.time,
    venueName: c.sample.venue,
    address: c.sample.address,
    mapUrl: "",
    message: c.sample.message,
    dressCode: "",
    contactPhone: "",
    program: [],
    photos: [`/samples/${c.id}.svg`],
    rsvpEnabled: true,
    rsvpDeadline: "",
    guestbookEnabled: true,
    showMap: true,
    drinksEnabled: DRINK_CATEGORIES.includes(c.id),
    drinks: DRINK_CATEGORIES.includes(c.id) ? [...drinkDefaults] : [],
  };
}

/** Vérifie les limites du palier. Lève une erreur lisible si dépassées. */
export function enforceTierLimits(content: InvitationContent, tier: Tier): void {
  const t = TIER_INFO[tier];
  if (content.photos.length > t.maxPhotos) {
    throw new Error(`Le palier ${t.label} autorise ${t.maxPhotos} photo(s) au maximum.`);
  }
  if (content.program.length > t.maxProgram) {
    throw new Error(
      t.maxProgram === 0
        ? `Le programme est disponible à partir du palier Standard.`
        : `Le palier ${t.label} autorise ${t.maxProgram} étapes de programme au maximum.`,
    );
  }
}

export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "aide", "contact", "connexion", "inscription", "modeles", "tarifs", "i", "www",
  "tableau-de-bord", "acheter", "cgu", "confidentialite", "remboursement", "cookies", "aliko", "aliko-event", "support", "paiement", "login", "register",
]);

export const customSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{2,38})[a-z0-9]$/, "3 à 40 caractères : lettres minuscules, chiffres et tirets")
  .refine((s) => !RESERVED_SLUGS.has(s), "Ce lien est réservé");

/** Applique les réglages de l'administration : une section désactivée n'apparaît plus, quoi que dise le contenu enregistré. */
export function applySections(
  content: InvitationContent,
  sections: { guestbook: boolean; map: boolean; drinks: boolean },
  maxDrinks: number,
): InvitationContent {
  return {
    ...content,
    guestbookEnabled: content.guestbookEnabled && sections.guestbook,
    showMap: content.showMap && sections.map,
    drinksEnabled: content.drinksEnabled && sections.drinks,
    drinks: content.drinks.slice(0, maxDrinks),
  };
}
