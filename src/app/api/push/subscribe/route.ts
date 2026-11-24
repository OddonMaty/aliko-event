import { z } from "zod";

import { requireApiUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { handle, json, readJson } from "@/lib/http";
import { assertSameOrigin, HttpError, rateLimit } from "@/lib/security";

const sub = z.object({
  endpoint: z.string().url().max(600).refine((u) => u.startsWith("https://"), "Adresse invalide"),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`push:${user.id}`, 20, 3600);
  const b = sub.parse(await readJson(req));
  const count = await q<{ n: number }>`SELECT count(*)::int AS n FROM push_subscriptions WHERE user_id = ${user.id}`;
  if ((count[0]?.n ?? 0) >= 10) throw new HttpError(409, "Trop d'appareils enregistrés");
  await q`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (${user.id}, ${b.endpoint}, ${b.keys.p256dh}, ${b.keys.auth})
          ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`;
  return json({ ok: true });
});

export const DELETE = handle(async (req) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const { endpoint } = z.object({ endpoint: z.string().max(600) }).parse(await readJson(req));
  await q`DELETE FROM push_subscriptions WHERE user_id = ${user.id} AND endpoint = ${endpoint}`;
  return json({ ok: true });
});
