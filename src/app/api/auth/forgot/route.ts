import { randomBytes } from "node:crypto";
import { z } from "zod";

import { q } from "@/lib/db";
import { button, layout, sendEmail } from "@/lib/email";
import { handle, json, readJson } from "@/lib/http";
import { assertSameOrigin, audit, clientIp, rateLimit, verifyTurnstile } from "@/lib/security";
import { sha256 } from "@/lib/tokens";
import { appUrl } from "@/lib/utils";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Email invalide").max(160), turnstile: z.string().optional() });

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const body = schema.parse(await readJson(req));
  await rateLimit(`forgot-ip:${ip}`, 10, 3600);
  await rateLimit(`forgot-email:${body.email}`, 3, 3600);
  await verifyTurnstile(body.turnstile, ip);

  const rows = await q<{ id: string; name: string }>`SELECT id, name FROM users WHERE lower(email) = ${body.email} AND disabled_at IS NULL`;
  const user = rows[0];
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await q`DELETE FROM password_resets WHERE user_id = ${user.id}`;
    await q`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (${sha256(token)}, ${user.id}, now() + interval '1 hour')`;
    await sendEmail(
      body.email,
      "Réinitialiser votre mot de passe",
      layout("Réinitialiser votre mot de passe", `<p>Bonjour ${user.name.replace(/[<>&"']/g, "")}, cliquez sur le bouton pour choisir un nouveau mot de passe. Ce lien est valable 1 heure.</p>${button(`${appUrl()}/reinitialiser?token=${token}`, "Choisir un nouveau mot de passe")}<p style="color:#888;font-size:12px">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`),
    );
    await audit(user.id, "user.password_reset_requested", "user", user.id);
  }
  // Même réponse que le compte existe ou non : on ne révèle pas qui a un compte.
  return json({ ok: true });
});
