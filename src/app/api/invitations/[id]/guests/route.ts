import { z } from "zod";

import { requireApiUser } from "@/lib/auth";
import { getSql, q } from "@/lib/db";
import { newGuestToken } from "@/lib/guests";
import { handle, json, readJson } from "@/lib/http";
import { getOwnedInvitation, isUuid } from "@/lib/invitations";
import { assertSameOrigin, audit, HttpError, rateLimit } from "@/lib/security";

const schema = z.object({
  names: z.array(z.string().trim().min(2, "Chaque nom doit faire au moins 2 caractères").max(80)).min(1).max(100),
});

// Ajout d'invités nommés (un lien personnel + un pass QR chacun).
export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`guests:${user.id}`, 60, 3600);
  const { id } = (await ctx.params) as { id: string };
  const inv = await getOwnedInvitation(id, user.id);
  if (inv.status !== "draft" && inv.status !== "published") throw new HttpError(403, "Modification impossible");

  const { names } = schema.parse(await readJson(req));
  // Dédoublonne (sans tenir compte de la casse) et nettoie les espaces.
  const seen = new Set<string>();
  const clean = names
    .map((n) => n.replace(/\s+/g, " ").trim())
    .filter((n) => {
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  const cap = inv.guest_limit;
  const count = await q<{ n: number }>`SELECT count(*)::int AS n FROM guests WHERE invitation_id = ${inv.id}`;
  const current = count[0]?.n ?? 0;
  if (current + clean.length > cap) {
    throw new HttpError(409, `Votre invitation permet ${cap} invités (${current} déjà ajoutés).`);
  }

  const sql = getSql();
  await sql.transaction(clean.map((name) => sql`INSERT INTO guests (invitation_id, name, token) VALUES (${inv.id}, ${name}, ${newGuestToken()})`));
  await audit(user.id, "guests.added", "invitation", inv.id, { count: clean.length });
  return json({ ok: true, added: clean.length });
});

export const DELETE = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = (await ctx.params) as { id: string };
  const inv = await getOwnedInvitation(id, user.id);
  const guestId = new URL(req.url).searchParams.get("guestId") ?? "";
  if (!isUuid(guestId)) throw new HttpError(400, "Invité invalide");
  await q`DELETE FROM guests WHERE id = ${guestId} AND invitation_id = ${inv.id}`;
  return json({ ok: true });
});
