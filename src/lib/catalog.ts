// Catalogue : catégories d'événements, paliers et prix (en cents USD).
// Prix d'une invitation = prix de base (catégorie × formule, pour 50 invités)
//                       + supplément par invité au-delà de 50 (taux propre à la catégorie).
// TOUS les prix se modifient ICI, à un seul endroit.

/** Paliers de nombre d'invités proposés à l'achat. */
export const GUEST_LIMITS = [50, 100, 200, 300, 500, 1000] as const;
export type GuestLimit = (typeof GUEST_LIMITS)[number];
/** Nombre d'invités inclus dans le prix de base. */
export const BASE_GUESTS = 50;

export function isGuestLimit(v: unknown): v is GuestLimit {
  return typeof v === "number" && (GUEST_LIMITS as readonly number[]).includes(v);
}

export const TIERS = ["essentiel", "standard", "premium"] as const;
export type Tier = (typeof TIERS)[number];

export const CATEGORY_IDS = [
  "mariage",
  "dot",
  "anniversaire",
  "baby-shower",
  "bapteme",
  "diplome",
  "conference",
  "reunion",
  "autre",
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Category {
  id: CategoryId;
  label: string;
  icon: "heart" | "gem" | "cake" | "baby" | "church" | "graduation" | "presentation" | "users" | "sparkles";
  tagline: string;
  eyebrow: string;
  sample: { title: string; subtitle: string; message: string; venue: string; address: string; time: string };
  /** Prix de base en cents USD par formule, pour BASE_GUESTS invités */
  prices: Record<Tier, number>;
  /** Supplément en cents USD par invité au-delà de BASE_GUESTS */
  extraGuestCents: number;
}

export const CATEGORIES: Category[] = [
  {
    id: "mariage",
    label: "Mariage",
    icon: "heart",
    tagline: "Faire-part de mariage élégants avec confirmation de présence.",
    eyebrow: "Vous êtes cordialement invités au mariage de",
    sample: {
      title: "Jean & Marie",
      subtitle: "Célébration & réception",
      message: "Nous avons la joie de vous convier à la célébration de notre union. Votre présence sera notre plus beau cadeau.",
      venue: "Salle Les Jardins",
      address: "Avenue de la Paix, Goma",
      time: "15:00",
    },
    prices: { essentiel: 1200, standard: 1800, premium: 2900 },
    extraGuestCents: 6,
  },
  {
    id: "dot",
    label: "Dot & fiançailles",
    icon: "gem",
    tagline: "Pour la dot, les fiançailles et les cérémonies traditionnelles.",
    eyebrow: "Vous êtes invités à la cérémonie de dot de",
    sample: {
      title: "Patrick & Grâce",
      subtitle: "Cérémonie de dot",
      message: "Les familles ont l'honneur de vous inviter à partager ce moment de joie et de tradition.",
      venue: "Résidence de la famille",
      address: "Quartier Himbi, Goma",
      time: "10:00",
    },
    prices: { essentiel: 1200, standard: 1800, premium: 2900 },
    extraGuestCents: 6,
  },
  {
    id: "anniversaire",
    label: "Anniversaire",
    icon: "cake",
    tagline: "Célébrez chaque année avec une invitation qui a du style.",
    eyebrow: "Vous êtes invités à l'anniversaire de",
    sample: {
      title: "Les 30 ans de Sarah",
      subtitle: "Une soirée pour célébrer",
      message: "Venez partager un moment de joie, de musique et de bonne humeur autour de moi.",
      venue: "Terrasse du Lac",
      address: "Boulevard Kanyamuhanga, Goma",
      time: "19:00",
    },
    prices: { essentiel: 600, standard: 900, premium: 1500 },
    extraGuestCents: 4,
  },
  {
    id: "baby-shower",
    label: "Baby shower",
    icon: "baby",
    tagline: "Accueillez bébé en douceur avec vos proches.",
    eyebrow: "Vous êtes invités à la baby shower de",
    sample: {
      title: "Baby Shower de Léa",
      subtitle: "Bientôt trois !",
      message: "Rejoignez-nous pour une après-midi douce et joyeuse avant l'arrivée de notre petit trésor.",
      venue: "Chez Léa",
      address: "Avenue des Roses, Bukavu",
      time: "14:00",
    },
    prices: { essentiel: 600, standard: 900, premium: 1500 },
    extraGuestCents: 3,
  },
  {
    id: "bapteme",
    label: "Baptême & religieux",
    icon: "church",
    tagline: "Baptême, communion, bénédiction : sobre et solennel.",
    eyebrow: "Vous êtes invités au baptême de",
    sample: {
      title: "Baptême de David",
      subtitle: "Messe suivie d'un repas fraternel",
      message: "Nous serions heureux de partager avec vous cette étape importante de la vie de notre enfant.",
      venue: "Paroisse Saint-Joseph",
      address: "Avenue du Lac, Goma",
      time: "11:00",
    },
    prices: { essentiel: 800, standard: 1200, premium: 1800 },
    extraGuestCents: 4,
  },
  {
    id: "diplome",
    label: "Remise de diplôme",
    icon: "graduation",
    tagline: "Fêtez la réussite, la graduation et les remises de diplômes.",
    eyebrow: "Vous êtes invités à la remise de diplôme de",
    sample: {
      title: "Promotion 2026",
      subtitle: "Cérémonie de remise des diplômes",
      message: "Venez célébrer le fruit de nombreuses années de travail et d'efforts.",
      venue: "Grand Auditorium",
      address: "Campus universitaire, Goma",
      time: "09:00",
    },
    prices: { essentiel: 600, standard: 900, premium: 1400 },
    extraGuestCents: 3,
  },
  {
    id: "conference",
    label: "Conférence & séminaire",
    icon: "presentation",
    tagline: "Invitations professionnelles pour conférences, ateliers et lancements.",
    eyebrow: "Vous êtes invités à la conférence",
    sample: {
      title: "Forum Innovation 2026",
      subtitle: "Entreprendre dans les Grands Lacs",
      message: "Une journée de rencontres, de partages d'expériences et d'opportunités.",
      venue: "Centre de conférences",
      address: "Avenue Nyamuragira, Goma",
      time: "08:30",
    },
    prices: { essentiel: 800, standard: 1200, premium: 2000 },
    extraGuestCents: 5,
  },
  {
    id: "reunion",
    label: "Réunion",
    icon: "users",
    tagline: "Réunions de famille, d'association ou d'entreprise.",
    eyebrow: "Vous êtes convoqués à la réunion",
    sample: {
      title: "Assemblée générale",
      subtitle: "Ordre du jour à suivre",
      message: "Votre présence est importante pour la suite de nos activités. Merci de confirmer votre venue.",
      venue: "Salle de réunion",
      address: "Centre-ville, Goma",
      time: "10:00",
    },
    prices: { essentiel: 600, standard: 1000, premium: 1600 },
    extraGuestCents: 3,
  },
  {
    id: "autre",
    label: "Autre événement",
    icon: "sparkles",
    tagline: "Tout autre événement mérite une belle invitation.",
    eyebrow: "Vous êtes invités à",
    sample: {
      title: "Soirée de gala",
      subtitle: "Une rencontre à ne pas manquer",
      message: "Nous serions ravis de vous accueillir pour ce moment unique.",
      venue: "Lieu de l'événement",
      address: "Adresse complète",
      time: "18:00",
    },
    prices: { essentiel: 500, standard: 800, premium: 1200 },
    extraGuestCents: 3,
  },
];

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Supplément (cents USD) pour un nombre d'invités donné. */
export function guestExtraCents(extraGuestCents: number, guests: number): number {
  return Math.max(0, guests - BASE_GUESTS) * extraGuestCents;
}

/** Prix final en cents USD. Toujours appelé côté serveur pour facturer. */
export function priceUsdCents(category: CategoryId, tier: Tier, guests: number = BASE_GUESTS): number {
  const c = getCategory(category);
  if (!c) throw new Error("Catégorie inconnue");
  return c.prices[tier] + guestExtraCents(c.extraGuestCents, guests);
}

export interface TierInfo {
  label: string;
  blurb: string;
  maxPhotos: number;
  maxProgram: number;
  csv: boolean;
  customSlug: boolean;
  brandingFree: boolean;
  features: string[];
  soon: string[];
}

export const TIER_INFO: Record<Tier, TierInfo> = {
  essentiel: {
    label: "Essentiel",
    blurb: "L'invitation, le lien et le QR code.",
    maxPhotos: 1,
    maxProgram: 0,
    csv: false,
    customSlug: false,
    brandingFree: false,
    features: ["1 photo", "Lien unique + QR code", "Confirmation de présence en ligne", "Carte du lieu"],
    soon: [],
  },
  standard: {
    label: "Standard",
    blurb: "Le choix de la plupart des événements.",
    maxPhotos: 6,
    maxProgram: 8,
    csv: true,
    customSlug: false,
    brandingFree: false,
    features: ["6 photos", "Programme de la journée", "Export Excel/CSV des réponses"],
    soon: [],
  },
  premium: {
    label: "Premium",
    blurb: "Pour les grands événements.",
    maxPhotos: 12,
    maxProgram: 8,
    csv: true,
    customSlug: true,
    brandingFree: true,
    features: ["12 photos", "Lien personnalisé (jean-et-marie)", "Sans mention Aliko Event"],
    soon: ["Musique d'ambiance"],
  },
};

export function minPriceForTier(tier: Tier): number {
  return Math.min(...CATEGORIES.map((c) => c.prices[tier]));
}

export function isTier(v: unknown): v is Tier {
  return typeof v === "string" && (TIERS as readonly string[]).includes(v);
}
