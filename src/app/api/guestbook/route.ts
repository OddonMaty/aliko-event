import { z } from "zod";

import { q } from "@/lib/db";
import { findGuest } from "@/lib/guests";
import { handle, json, readJson } from "@/lib/http";
import { notifyGuestbook } from "@/lib/notify";
import { parseStoredContent } from "@/lib/invitations";
import { assertSameOrigin, clientIp, hashIp, HttpError, rateLimit, verifyTurnstile } from "@/lib/security";

const schema = z.object({
  slug: z.string().min(3).max(60),
  name: z.string().trim().min(2, "Indiquez votre nom").max(60),
  message: z.string().trim().min(2, "Écrivez un petit mot").max(280, "280 caractères maximum"),
  guestToken: z.string().max(40).optional(),
  turnstile: z.string().optional(),
});

// Les mots doux sont publics : pas de liens (hameçonnage / spam).
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|cd|io|me|co|app|link|ly|info|biz)\b)/i;
const MAX_PER_INVITATION = 500;

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  const body = schema.parse(await readJson(req));

  await rateLimit(`gb-ip:${ipHash}`, 30, 3600);
  await rateLimit(`gb:${body.slug}:${ipHash}`, 5, 3600);
  await verifyTurnstile(body.turnstile, ip);

  if (LINK.test(body.message) || LINK.test(body.name)) {
    throw new HttpError(400, "Les liens ne sont pas autorisés dans les messages.");
  }

  const rows = await q<{ id: string; content: unknown }>`
    SELECT id, content FROM invitations
    WHERE slug = ${body.slug} AND status = 'published' AND (expires_at IS NULL OR expires_at > now())`;
  const inv = rows[0];
  if (!inv) throw new HttpError(404, "Invitation introuvable ou expirée");
  if (!parseStoredContent(inv.content).guestbookEnabled) throw new HttpError(403, "Les mots doux sont désactivés");

  const count = await q<{ n: number }>`SELECT count(*)::int AS n FROM guestbook WHERE invitation_id = ${inv.id}`;
  if ((count[0]?.n ?? 0) >= MAX_PER_INVITATION) throw new HttpError(409, "Le livre d'or est complet");

  // Invité identifié : son nom est celui enregistré par l'organisateur (pas d'usurpation).
  const guest = body.guestToken ? await findGuest(inv.id, body.guestToken) : null;
  if (body.guestToken && !guest) throw new HttpError(404, "Lien d'invité invalide");
  const name = guest ? guest.name : body.name;

  const saved = await q<{ id: string; created_at: Date }>`
    INSERT INTO guestbook (invitation_id, guest_id, name, message, ip_hash)
    VALUES (${inv.id}, ${guest?.id ?? null}, ${name}, ${body.message}, ${ipHash})
    RETURNING id, created_at`;
  await notifyGuestbook(inv.id, name, body.message);
  return json({ ok: true, message: { id: saved[0]!.id, name, message: body.message, created_at: new Date(saved[0]!.created_at).toISOString() } });
});
