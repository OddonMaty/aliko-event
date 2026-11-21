import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { q } from "./db";
import { HttpError } from "./security";

const COOKIE = "aliko_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secretKey() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error("SESSION_SECRET manquant ou trop court (24 caractères minimum)");
  return new TextEncoder().encode(s);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    const rows = await q<SessionUser>`SELECT id, email, name, role FROM users WHERE id = ${payload.sub}`;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Pour les pages : redirige vers la connexion si non connecté. */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

/** Pour les routes API : lève une 401 si non connecté. */
export async function requireApiUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Connexion requise");
  return user;
}

/** N'autorise que des chemins internes (évite les redirections ouvertes). */
export function safeNext(next: string | null | undefined, fallback = "/tableau-de-bord"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
