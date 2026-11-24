import bcrypt from "bcryptjs";
import { z } from "zod";

import { createSession, safeNext } from "@/lib/auth";
import { q } from "@/lib/db";
import { handle, json, readJson } from "@/lib/http";
import { button, layout, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/utils";
import { assertSameOrigin, clientIp, HttpError, rateLimit, verifyTurnstile, audit } from "@/lib/security";

const schema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80),
  email: z.string().trim().toLowerCase().email("Email invalide").max(160),
  phone: z.string().trim().max(30).regex(/^[+\d\s().-]*$/, "Numéro invalide").optional().default(""),
  password: z.string().min(8, "8 caractères minimum").max(128),
  turnstile: z.string().optional(),
  next: z.string().optional(),
});

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await rateLimit(`register:${ip}`, 10, 3600);

  const body = schema.parse(await readJson(req));
  await verifyTurnstile(body.turnstile, ip);

  const hash = await bcrypt.hash(body.password, 11);
  const rows = await q<{ id: string }>`
    INSERT INTO users (email, password_hash, name, phone)
    VALUES (${body.email}, ${hash}, ${body.name}, ${body.phone || null})
    ON CONFLICT DO NOTHING
    RETURNING id`;
  if (!rows[0]) throw new HttpError(409, "Un compte existe déjà avec cet email. Connectez-vous.");

  await createSession(rows[0].id);
  await audit(rows[0].id, "user.registered", "user", rows[0].id);
  await sendEmail(body.email, "Bienvenue sur Aliko Event", layout(`Bienvenue, ${body.name}`, `<p>Votre compte est prêt. Choisissez un modèle, personnalisez-le et envoyez le lien à vos invités.</p>${button(`${appUrl()}/modeles`, "Voir les modèles")}`));
  return json({ ok: true, next: safeNext(body.next) });
});
