import { z } from "zod";

import { createSession, safeNext } from "@/lib/auth";
import { q } from "@/lib/db";
import { handle, json, readJson } from "@/lib/http";
import { assertSameOrigin, audit, clientIp, HttpError, rateLimit, safeEqual } from "@/lib/security";
import { codeHash } from "@/lib/tokens";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide").max(160),
  code: z.string().trim().regex(/^\d{6}$/, "Le code a 6 chiffres"),
  next: z.string().optional(),
});

const BAD = "Code incorrect ou expiré. Demandez-en un nouveau.";

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const body = schema.parse(await readJson(req));
  await rateLimit(`codev-ip:${ip}`, 30, 900);
  await rateLimit(`codev-email:${body.email}`, 10, 900);

  // Incrémente d'abord les essais (5 maximum par code), puis compare.
  const rows = await q<{ code_hash: string }>`
    UPDATE login_codes SET attempts = attempts + 1
    WHERE email = ${body.email} AND expires_at > now() AND attempts < 5
    RETURNING code_hash`;
  const row = rows[0];
  if (!row || !safeEqual(row.code_hash, codeHash(body.email, body.code))) throw new HttpError(401, BAD);

  await q`DELETE FROM login_codes WHERE email = ${body.email}`;
  const users = await q<{ id: string }>`SELECT id FROM users WHERE lower(email) = ${body.email} AND disabled_at IS NULL`;
  const user = users[0];
  if (!user) throw new HttpError(401, BAD);

  await createSession(user.id);
  await audit(user.id, "user.login_code", "user", user.id);
  return json({ ok: true, next: safeNext(body.next) });
});
