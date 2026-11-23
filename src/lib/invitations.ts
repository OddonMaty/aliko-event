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

/** Date d'expiration : 30 jours après l'événement (fin de journée). */
export function expiryFromEventDate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 31);
  return d.toISOString();
}
