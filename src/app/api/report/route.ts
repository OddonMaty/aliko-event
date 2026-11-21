import { z } from "zod";

import { q } from "@/lib/db";
import { handle, json, readJson } from "@/lib/http";
import { assertSameOrigin, clientIp, hashIp, HttpError, rateLimit, verifyTurnstile } from "@/lib/security";

const schema = z.object({
  slug: z.string().min(3).max(60),
  reason: z.enum(["arnaque", "contenu-inapproprie", "usurpation", "autre"]),
  details: z.string().trim().max(500).optional().default(""),
  turnstile: z.string().optional(),
});

// Signalement d'une invitation (arnaque, contenu inapproprié…). Examiné par un administrateur.
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  const body = schema.parse(await readJson(req));
  await rateLimit(`report:${ipHash}`, 5, 3600);
  await verifyTurnstile(body.turnstile, ip);

  const rows = await q<{ id: string }>`SELECT id FROM invitations WHERE slug = ${body.slug}`;
  if (!rows[0]) throw new HttpError(404, "Invitation introuvable");

  await q`INSERT INTO abuse_reports (invitation_id, reason, details, ip_hash)
          VALUES (${rows[0].id}, ${body.reason}, ${body.details || null}, ${ipHash})`;
  return json({ ok: true });
});
