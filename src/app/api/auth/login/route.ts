import bcrypt from "bcryptjs";
import { z } from "zod";

import { createSession, safeNext } from "@/lib/auth";
import { q } from "@/lib/db";
import { handle, json, readJson } from "@/lib/http";
import { assertSameOrigin, clientIp, HttpError, rateLimit, verifyTurnstile } from "@/lib/security";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide").max(160),
  password: z.string().min(1).max(128),
  turnstile: z.string().optional(),
  next: z.string().optional(),
});

// Hash factice : on fait toujours un compare() pour ne pas révéler si l'email existe (timing).
const DUMMY_HASH = bcrypt.hashSync("aliko-dummy-password", 11);

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const body = schema.parse(await readJson(req));

  await rateLimit(`login-ip:${ip}`, 30, 900);
  await rateLimit(`login-email:${body.email}`, 8, 900);
  await verifyTurnstile(body.turnstile, ip);

  const rows = await q<{ id: string; password_hash: string; disabled_at: string | null }>`
    SELECT id, password_hash, disabled_at FROM users WHERE lower(email) = ${body.email}`;
  const user = rows[0];
  const ok = await bcrypt.compare(body.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, "Email ou mot de passe incorrect");

  if (user.disabled_at) throw new HttpError(403, "Ce compte est suspendu. Contactez le support.");

  await createSession(user.id);
  return json({ ok: true, next: safeNext(body.next) });
});
