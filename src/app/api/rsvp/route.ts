import { z } from "zod";

import { q } from "@/lib/db";
import { handle, json, readJson } from "@/lib/http";
import { findGuest } from "@/lib/guests";
import { notifyRsvp } from "@/lib/notify";
import { parseStoredContent } from "@/lib/invitations";
import { assertSameOrigin, clientIp, hashIp, HttpError, rateLimit, verifyTurnstile } from "@/lib/security";

const schema = z.object({
  slug: z.string().min(3).max(60),
  name: z.string().trim().min(2, "Indiquez votre nom").max(80),
  phone: z.string().trim().max(30).regex(/^[+\d\s().-]*$/, "Numéro invalide").optional().default(""),
  email: z.union([z.literal(""), z.string().trim().email("Email invalide").max(160)]).optional().default(""),
  attendance: z.enum(["yes", "no", "maybe"]),
  partySize: z.number().int().min(1).max(2).default(1),
  message: z.string().trim().max(300).optional().default(""),
  drink: z.string().trim().max(30).optional().default(""),
  guestToken: z.string().max(40).optional(),
  turnstile: z.string().optional(),
});

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  const body = schema.parse(await readJson(req));

  await rateLimit(`rsvp-ip:${ipHash}`, 40, 3600);
  await rateLimit(`rsvp:${body.slug}:${ipHash}`, 6, 3600);
  await verifyTurnstile(body.turnstile, ip);

  const rows = await q<{ id: string; guest_limit: number; content: unknown }>`
    SELECT id, guest_limit, content FROM invitations
    WHERE slug = ${body.slug} AND status = 'published' AND (expires_at IS NULL OR expires_at > now())`;
  const inv = rows[0];
  if (!inv) throw new HttpError(404, "Invitation introuvable ou expirée");

  const content = parseStoredContent(inv.content);
  if (!content.rsvpEnabled) throw new HttpError(403, "Les réponses sont désactivées pour cet événement");
  if (content.rsvpDeadline && new Date().toISOString().slice(0, 10) > content.rsvpDeadline) {
    throw new HttpError(410, "La date limite de réponse est dépassée");
  }

  const phone = body.phone || null;
  // Boisson : acceptée uniquement si l'organisateur la propose et si la personne vient.
  const drink = content.drinksEnabled && body.attendance !== "no" && content.drinks.includes(body.drink) ? body.drink : null;

  // Invité identifié par son lien personnel : une seule réponse par invité, au nom enregistré par l'organisateur.
  if (body.guestToken) {
    const guest = await findGuest(inv.id, body.guestToken);
    if (!guest) throw new HttpError(404, "Lien d'invité invalide");
    // Le type d'invitation (seul(e) ou couple) est fixé par l'organisateur, pas par l'invité.
    body.partySize = body.attendance === "no" ? 1 : guest.partyType === "couple" ? 2 : 1;
    await q`INSERT INTO rsvps (invitation_id, guest_id, name, phone, email, attendance, party_size, message, drink, ip_hash)
            VALUES (${inv.id}, ${guest.id}, ${guest.name}, ${phone}, ${body.email || null}, ${body.attendance}, ${body.partySize}, ${body.message || null}, ${drink}, ${ipHash})
            ON CONFLICT (guest_id) WHERE guest_id IS NOT NULL
            DO UPDATE SET attendance = EXCLUDED.attendance, party_size = EXCLUDED.party_size, message = EXCLUDED.message,
                          phone = EXCLUDED.phone, email = EXCLUDED.email, drink = EXCLUDED.drink, ip_hash = EXCLUDED.ip_hash, created_at = now()`;
    await notifyRsvp(inv.id, { name: guest.name, phone, email: body.email || null, attendance: body.attendance, partySize: body.partySize, message: body.message || null, drink }, false);
    return json({ ok: true });
  }

  if (body.attendance === "no") body.partySize = 1;

  // Doublon (même nom + même téléphone) : on met à jour la réponse précédente.
  const existing = await q<{ id: string }>`
    SELECT id FROM rsvps
    WHERE invitation_id = ${inv.id} AND lower(name) = lower(${body.name}) AND COALESCE(phone, '') = ${phone ?? ""}
    LIMIT 1`;

  if (existing[0]) {
    await q`UPDATE rsvps SET attendance = ${body.attendance}, party_size = ${body.partySize},
              message = ${body.message || null}, email = ${body.email || null}, drink = ${drink}, ip_hash = ${ipHash}, created_at = now()
            WHERE id = ${existing[0].id}`;
    await notifyRsvp(inv.id, { name: body.name, phone, email: body.email || null, attendance: body.attendance, partySize: body.partySize, message: body.message || null, drink }, true);
    return json({ ok: true, updated: true });
  }

  const count = await q<{ n: number }>`SELECT count(*)::int AS n FROM rsvps WHERE invitation_id = ${inv.id}`;
  if ((count[0]?.n ?? 0) >= inv.guest_limit) {
    throw new HttpError(409, "Cette invitation a atteint son nombre maximum de réponses");
  }

  await q`INSERT INTO rsvps (invitation_id, name, phone, email, attendance, party_size, message, drink, ip_hash)
          VALUES (${inv.id}, ${body.name}, ${phone}, ${body.email || null}, ${body.attendance}, ${body.partySize}, ${body.message || null}, ${drink}, ${ipHash})`;
  await notifyRsvp(inv.id, { name: body.name, phone, email: body.email || null, attendance: body.attendance, partySize: body.partySize, message: body.message || null, drink }, false);
  return json({ ok: true });
});
