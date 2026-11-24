import bcrypt from "bcryptjs";
import { z } from "zod";

import { q } from "@/lib/db";
import { handle, json, readJson } from "@/lib/http";
import { assertSameOrigin, audit, clientIp, HttpError, rateLimit } from "@/lib/security";
import { sha256 } from "@/lib/tokens";

const schema = z.object({ token: z.string().min(20).max(100), password: z.string().min(8, "8 caractères minimum").max(128) });

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  await rateLimit(`reset-ip:${clientIp(req)}`, 20, 3600);
  const body = schema.parse(await readJson(req));

  const rows = await q<{ user_id: string }>`DELETE FROM password_resets WHERE token_hash = ${sha256(body.token)} AND expires_at > now() RETURNING user_id`;
  const row = rows[0];
  if (!row) throw new HttpError(400, "Ce lien est invalide ou a expiré. Demandez-en un nouveau.");

  const hash = await bcrypt.hash(body.password, 11);
  await q`UPDATE users SET password_hash = ${hash} WHERE id = ${row.user_id}`;
  await q`DELETE FROM password_resets WHERE user_id = ${row.user_id}`;
  await audit(row.user_id, "user.password_reset", "user", row.user_id);
  return json({ ok: true });
});
