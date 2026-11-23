import { z } from "zod";

import { requireApiUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { isGuestToken } from "@/lib/guests";
import { handle, json, readJson } from "@/lib/http";
import { getOwnedInvitation, isUuid } from "@/lib/invitations";
import { assertSameOrigin, HttpError, rateLimit } from "@/lib/security";

/** Extrait le jeton d'invité d'un QR (lien complet « …?g=jeton » ou jeton seul). */
function extractToken(code: string): string | null {
  const raw = code.trim();
  if (isGuestToken(raw)) return raw;
  try {
    const g = new URL(raw).searchParams.get("g");
    return isGuestToken(g) ? g : null;
  } catch {
    return null;
  }
}

async function partyOf(guestId: string): Promise<number | null> {
  const r = await q<{ party_size: number; attendance: string }>`SELECT party_size, attendance FROM rsvps WHERE guest_id = ${guestId}`;
  return r[0] && r[0].attendance !== "no" ? r[0].party_size : null;
}

// Scan d'un pass QR à l'entrée : marque l'invité comme entré (une seule fois).
export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`checkin:${user.id}`, 1200, 3600);
  const { id } = (await ctx.params) as { id: string };
  const inv = await getOwnedInvitation(id, user.id);

  const { code } = z.object({ code: z.string().max(500) }).parse(await readJson(req));
  const token = extractToken(code);
  if (!token) throw new HttpError(400, "Ce QR code n'est pas un pass Aliko Event");

  const entered = await q<{ id: string; name: string }>`
    UPDATE guests SET checked_in_at = now()
    WHERE invitation_id = ${inv.id} AND token = ${token} AND checked_in_at IS NULL
    RETURNING id, name`;
  if (entered[0]) return json({ status: "ok", guestId: entered[0].id, name: entered[0].name, party: await partyOf(entered[0].id) });

  const known = await q<{ id: string; name: string; checked_in_at: Date }>`
    SELECT id, name, checked_in_at FROM guests WHERE invitation_id = ${inv.id} AND token = ${token}`;
  if (!known[0]) throw new HttpError(404, "Pass inconnu pour cet événement");
  return json({
    status: "already",
    guestId: known[0].id,
    name: known[0].name,
    at: new Date(known[0].checked_in_at).toISOString(),
    party: await partyOf(known[0].id),
  });
});

// Liste de secours : marquer / annuler l'entrée d'un invité à la main.
export const PATCH = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`checkin:${user.id}`, 1200, 3600);
  const { id } = (await ctx.params) as { id: string };
  const inv = await getOwnedInvitation(id, user.id);

  const body = z.object({ guestId: z.string(), checkedIn: z.boolean() }).parse(await readJson(req));
  if (!isUuid(body.guestId)) throw new HttpError(400, "Invité invalide");
  const rows = await q<{ id: string }>`
    UPDATE guests SET checked_in_at = ${body.checkedIn ? new Date().toISOString() : null}
    WHERE id = ${body.guestId} AND invitation_id = ${inv.id} RETURNING id`;
  if (!rows[0]) throw new HttpError(404, "Invité introuvable");
  return json({ ok: true });
});
