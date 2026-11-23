import { q } from "./db";
import { contentSchema, type InvitationContent } from "./content";
import type { Tier } from "./catalog";
import { HttpError } from "./security";

export interface InvitationRow {
  id: string;
  user_id: string;
  order_id: string;
  slug: string;
  template_id: string;
  category: string;
  tier: Tier;
  guest_limit: number;
  status: "awaiting_payment" | "draft" | "published" | "suspended" | "archived";
  content: unknown;
  event_date: string | null;
  expires_at: Date | null;
  published_at: Date | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID.test(v);

export async function getOwnedInvitation(id: string, userId: string): Promise<InvitationRow> {
  if (!isUuid(id)) throw new HttpError(404, "Invitation introuvable");
  const rows = await q<InvitationRow>`
    SELECT id, user_id, order_id, slug, template_id, category, tier, guest_limit, status, content,
           event_date::text AS event_date, expires_at, published_at
    FROM invitations WHERE id = ${id} AND user_id = ${userId}`;
  if (!rows[0]) throw new HttpError(404, "Invitation introuvable");
  return rows[0];
}

/** Lit le contenu stocké en le re-validant (défense en profondeur). */
export function parseStoredContent(raw: unknown): InvitationContent {
  const parsed = contentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Contenu corrompu : on retombe sur un contenu minimal plutôt que de planter la page.
  return contentSchema.parse({ title: "Invitation" });
}

/** Fuseau de référence : Kinshasa (UTC+1, sans changement d'heure). */
const KINSHASA_OFFSET_MS = 60 * 60 * 1000;

/** Date du jour à Kinshasa, au format AAAA-MM-JJ. */
export function todayKinshasa(): string {
  return new Date(Date.now() + KINSHASA_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Date d'expiration : fin de la journée qui suit l'événement (minuit à Kinshasa, soit J+2 à 00:00).
 * Exemple : mariage le 10 → l'invitation reste en ligne jusqu'au 11 à minuit, puis elle est supprimée.
 */
export function expiryFromEventDate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T00:00:00+01:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 2);
  return d.toISOString();
}

/** Dernier jour en ligne (AAAA-MM-JJ) : le lendemain de l'événement. */
export function lastOnlineDay(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
