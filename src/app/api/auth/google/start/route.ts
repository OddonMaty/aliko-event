import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { safeNext } from "@/lib/auth";
import { googleConfigured, googleRedirectUri, OAUTH_COOKIE } from "@/lib/google";
import { clientIp, rateLimit } from "@/lib/security";

export async function GET(req: Request) {
  if (!googleConfigured()) redirect("/connexion?erreur=google-indisponible");
  await rateLimit(`google-start:${clientIp(req)}`, 30, 900).catch(() => redirect("/connexion?erreur=trop-de-tentatives"));

  const next = safeNext(new URL(req.url).searchParams.get("next") ?? undefined);
  const state = randomBytes(24).toString("base64url");
  const jar = await cookies();
  jar.set(OAUTH_COOKIE, `${state}|${encodeURIComponent(next)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
