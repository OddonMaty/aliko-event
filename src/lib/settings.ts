import { q } from "@/lib/db";
import { CATEGORIES, GUEST_LIMITS, TIERS, TIER_INFO, type Tier } from "@/lib/catalog";
import { isAllowedImageUrl } from "@/lib/content";
import { SAMPLE_THEMES } from "@/lib/samples";
import { DEFAULT_DRINKS, DRINK_PRESETS, MAX_DRINKS } from "@/lib/drinks";

/**
 * Réglages modifiables depuis l'administration (prix, formules, boissons, sections…).
 * Les valeurs du code servent de valeurs par défaut ; ce qui est enregistré en base les remplace.
 */
export interface AppSettings {
  prices: Record<string, { essentiel: number; standard: number; premium: number; extraGuestCents: number }>;
  tiers: Record<Tier, { maxPhotos: number; maxProgram: number }>;
  guestLimits: number[];
  drinks: { presets: string[]; defaults: string[]; max: number };
  rsvp: { maxPartySize: number };
  sections: { guestbook: boolean; map: boolean; drinks: boolean };
  /** Photos d'exemple choisies par l'administrateur, par thème (adresses de notre stockage uniquement). */
  samples: Record<string, string>;
}

// Photographie des valeurs du code, prise avant toute modification en place.
const DEFAULTS: AppSettings = {
  prices: Object.fromEntries(CATEGORIES.map((c) => [c.id, { ...c.prices, extraGuestCents: c.extraGuestCents }])),
  tiers: Object.fromEntries(TIERS.map((t) => [t, { maxPhotos: TIER_INFO[t].maxPhotos, maxProgram: TIER_INFO[t].maxProgram }])) as AppSettings["tiers"],
  guestLimits: [...GUEST_LIMITS],
  drinks: { presets: [...DRINK_PRESETS], defaults: [...DEFAULT_DRINKS], max: MAX_DRINKS },
  rsvp: { maxPartySize: 10 },
  sections: { guestbook: true, map: true, drinks: true },
  samples: {},
};
const BASE_FEATURES: Record<Tier, string[]> = Object.fromEntries(TIERS.map((t) => [t, [...TIER_INFO[t].features]])) as Record<Tier, string[]>;

export function defaultSettings(): AppSettings {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

const int = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === "number" ? Math.round(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const names = (v: unknown, max: number, fallback: string[]) => {
  if (!Array.isArray(v)) return fallback;
  const out: string[] = [];
  for (const x of v) {
    const t = typeof x === "string" ? x.trim().slice(0, 30) : "";
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out.slice(0, max);
};

const at = (o: unknown, ...path: string[]): unknown => {
  let cur: unknown = o;
  for (const k of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
};

/** Fusionne des données quelconques avec les valeurs par défaut, en bornant tout : jamais de valeur absurde. */
export function sanitizeSettings(raw: unknown): AppSettings {
  const d = defaultSettings();

  for (const id of Object.keys(d.prices)) {
    const mine = d.prices[id]!;
    for (const k of ["essentiel", "standard", "premium"] as const) mine[k] = int(at(raw, "prices", id, k), 100, 1_000_000, mine[k]); // 1 $ à 10 000 $
    mine.extraGuestCents = int(at(raw, "prices", id, "extraGuestCents"), 0, 10_000, mine.extraGuestCents);
  }
  for (const t of TIERS) {
    d.tiers[t].maxPhotos = int(at(raw, "tiers", t, "maxPhotos"), 1, 12, d.tiers[t].maxPhotos);
    d.tiers[t].maxProgram = int(at(raw, "tiers", t, "maxProgram"), 0, 12, d.tiers[t].maxProgram);
  }
  const limits = at(raw, "guestLimits");
  if (Array.isArray(limits)) {
    const list = [...new Set<number>(limits.map((n: unknown) => int(n, 10, 5000, 0)).filter(Boolean))].sort((a, b) => a - b).slice(0, 8);
    if (!list.includes(50)) list.push(50); // 50 invités = base du tarif
    d.guestLimits = list.sort((a, b) => a - b);
  }
  d.drinks.max = int(at(raw, "drinks", "max"), 1, 20, d.drinks.max);
  d.drinks.presets = names(at(raw, "drinks", "presets"), 40, d.drinks.presets);
  d.drinks.defaults = names(at(raw, "drinks", "defaults"), d.drinks.max, d.drinks.defaults);
  d.rsvp.maxPartySize = int(at(raw, "rsvp", "maxPartySize"), 1, 20, d.rsvp.maxPartySize);
  d.sections.guestbook = bool(at(raw, "sections", "guestbook"), true);
  d.sections.map = bool(at(raw, "sections", "map"), true);
  d.sections.drinks = bool(at(raw, "sections", "drinks"), true);

  const samples = at(raw, "samples");
  if (samples && typeof samples === "object") {
    for (const theme of SAMPLE_THEMES) {
      const u = (samples as Record<string, unknown>)[theme];
      if (typeof u === "string" && u.startsWith("https://") && u.length <= 500 && isAllowedImageUrl(u)) d.samples[theme] = u;
    }
  }
  return d;
}

let cache: { at: number; value: AppSettings } | null = null;
const TTL = 15_000;

export function invalidateSettings() {
  cache = null;
}

export async function getSettings(): Promise<AppSettings> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  let stored: unknown = null;
  try {
    const rows = await q<{ value: unknown }>`SELECT value FROM settings WHERE key = 'app'`;
    stored = rows[0]?.value ?? null;
  } catch {
    stored = null; // base indisponible : on garde les valeurs du code
  }
  const value = sanitizeSettings(stored);
  applyToCatalog(value);
  cache = { at: Date.now(), value };
  return value;
}

/** Remplace sur place les prix, limites et listes du catalogue : le reste du code n'a rien à changer. */
function applyToCatalog(s: AppSettings) {
  for (const c of CATEGORIES) {
    const p = s.prices[c.id];
    if (!p) continue;
    c.prices = { essentiel: p.essentiel, standard: p.standard, premium: p.premium };
    c.extraGuestCents = p.extraGuestCents;
  }
  for (const t of TIERS) {
    TIER_INFO[t].maxPhotos = s.tiers[t].maxPhotos;
    TIER_INFO[t].maxProgram = s.tiers[t].maxProgram;
    const n = s.tiers[t].maxPhotos;
    TIER_INFO[t].features = [`${n} photo${n > 1 ? "s" : ""}`, ...BASE_FEATURES[t].slice(1)];
  }
  GUEST_LIMITS.splice(0, GUEST_LIMITS.length, ...s.guestLimits);
}

/** À appeler en tête de chaque page ou route qui affiche ou contrôle des prix, des limites ou des options. */
export const loadCatalog = getSettings;

export async function saveSettings(next: AppSettings, userId: string) {
  const clean = sanitizeSettings(next);
  await q`INSERT INTO settings (key, value, updated_by) VALUES ('app', ${JSON.stringify(clean)}::jsonb, ${userId})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`;
  invalidateSettings();
  return clean;
}
