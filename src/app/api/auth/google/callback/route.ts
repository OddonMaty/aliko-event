import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSession, safeNext } from "@/lib/auth";
import { q } from "@/lib/db";
import { button, layout, sendEmail } from "@/lib/email";
import { googleConfigured, googleRedirectUri, OAUTH_COOKIE } from "@/lib/google";
import { audit, clientIp, rateLimit, safeEqual } from "@/lib/security";
import { appUrl } from "@/lib/utils";

const fail = (reason: string): never => redirect(`/connexion?erreur=${reason}`);

export async function GET(req: Request) {
  if (!googleConfigured()) fail("google-indisponible");
  await rateLimit(`google-cb:${clientIp(req)}`, 30, 900).catch(() => fail("trop-de-tentatives"));

  const url = new URL(req.url);
  const jar = await cookies();
  const [state, nextEnc] = (jar.get(OAUTH_COOKIE)?.value ?? "").split("|");
  jar.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });

  const code = url.searchParams.get("code");
  const gotState = url.searchParams.get("state") ?? "";
  if (url.searchParams.get("error") || !code || !state || !safeEqual(state, gotState)) fail("google-annule");

  let email = "";
  let name = "";
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: googleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}`);
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) throw new Error("no access_token");

    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${access_token}` } });
    if (!infoRes.ok) throw new Error(`userinfo ${infoRes.status}`);
    const info = (await infoRes.json()) as { email?: string; email_verified?: boolean; name?: string };
    if (!info.email || info.email_verified !== true) throw new Error("email non vérifié");
    email = info.email.trim().toLowerCase();
    name = (info.name ?? "").trim().slice(0, 80) || email.split("@")[0]!;
  } catch (e) {
    console.error("[google]", e);
    fail("google-echec");
  }

  const existing = await q<{ id: string; disabled_at: string | null }>`SELECT id, disabled_at FROM users WHERE lower(email) = ${email}`;
  let userId = existing[0]?.id;
  if (existing[0]?.disabled_at) fail("compte-suspendu");

  if (!userId) {
    // Nouveau compte : mot de passe aléatoire inutilisable (l'utilisateur pourra en définir un via « Mot de passe oublié »).
    const hash = await bcrypt.hash(randomBytes(32).toString("base64url"), 11);
    const rows = await q<{ id: string }>`
      INSERT INTO users (email, password_hash, name) VALUES (${email}, ${hash}, ${name})
      ON CONFLICT DO NOTHING RETURNING id`;
    userId = rows[0]?.id ?? (await q<{ id: string }>`SELECT id FROM users WHERE lower(email) = ${email}`)[0]?.id;
    if (!userId) fail("google-echec");
    await audit(userId!, "user.registered", "user", userId!, { via: "google" });
    await sendEmail(email, "Bienvenue sur Aliko Event", layout(`Bienvenue, ${name}`, `<p>Votre compte est prêt. Choisissez un modèle, personnalisez-le et envoyez le lien à vos invités.</p>${button(`${appUrl()}/modeles`, "Voir les modèles")}`));
  } else {
    await audit(userId, "user.login_google", "user", userId);
  }

  await createSession(userId!);
  redirect(safeNext(nextEnc ? decodeURIComponent(nextEnc) : undefined));
}
