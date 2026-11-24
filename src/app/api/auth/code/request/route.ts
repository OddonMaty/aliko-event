import { randomInt } from "node:crypto";
import { z } from "zod";

import { q } from "@/lib/db";
import { emailConfigured, esc, layout, sendEmail } from "@/lib/email";
import { handle, json, readJson } from "@/lib/http";
import { assertSameOrigin, audit, clientIp, HttpError, rateLimit, verifyTurnstile } from "@/lib/security";
import { codeHash } from "@/lib/tokens";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Email invalide").max(160), turnstile: z.string().optional() });

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const body = schema.parse(await readJson(req));
  await rateLimit(`code-ip:${ip}`, 15, 3600);
  await rateLimit(`code-email:${body.email}`, 5, 900);
  await verifyTurnstile(body.turnstile, ip);

  if (!emailConfigured()) throw new HttpError(503, "L'envoi de codes par e-mail n'est pas encore activé. Utilisez votre mot de passe.");

  const rows = await q<{ id: string; name: string }>`SELECT id, name FROM users WHERE lower(email) = ${body.email} AND disabled_at IS NULL`;
  const user = rows[0];
  if (user) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await q`INSERT INTO login_codes (email, code_hash, attempts, expires_at)
            VALUES (${body.email}, ${codeHash(body.email, code)}, 0, now() + interval '10 minutes')
            ON CONFLICT (email) DO UPDATE SET code_hash = EXCLUDED.code_hash, attempts = 0, expires_at = EXCLUDED.expires_at, created_at = now()`;
    await sendEmail(
      body.email,
      `Votre code de connexion : ${code}`,
      layout("Votre code de connexion", `<p>Bonjour ${esc(user.name)}, voici votre code. Il est valable 10 minutes et ne sert qu'une fois.</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:20px 0">${code}</p><p style="color:#888;font-size:12px">Si vous n'avez rien demandé, ignorez ce message : personne ne peut se connecter sans ce code.</p>`),
    );
    await audit(user.id, "user.login_code_sent", "user", user.id);
  }
  // Même réponse que le compte existe ou non.
  return json({ ok: true });
});
