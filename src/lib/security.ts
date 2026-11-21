import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { q } from "./db";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  return xf?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** IP hachée (on ne stocke jamais l'IP en clair). */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.SESSION_SECRET ?? ""))
    .digest("hex")
    .slice(0, 32);
}

/**
 * Limiteur de débit persistant (fenêtre fixe) stocké en base.
 * Lève une erreur 429 si la limite est dépassée.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<void> {
  const rows = await q<{ count: number }>`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}::double precision)
                   THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}::double precision)
                          THEN now() ELSE rate_limits.window_start END
    RETURNING count`;
  if ((rows[0]?.count ?? 0) > limit) {
    throw new HttpError(429, "Trop de tentatives. Patientez un moment avant de réessayer.");
  }
}

/** Protection CSRF : refuse les requêtes dont l'origine ne correspond pas à notre site. */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin) {
    // Les navigateurs envoient toujours Origin sur un POST/PUT/DELETE de même origine.
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") throw new HttpError(403, "Origine refusée");
    return;
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "Origine refusée");
  }
  if (originHost !== host) throw new HttpError(403, "Origine refusée");
}

/** Vérifie le jeton Cloudflare Turnstile (ignoré si non configuré, ex. en développement). */
export async function verifyTurnstile(token: unknown, ip: string): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return;
  if (typeof token !== "string" || token.length < 10) {
    throw new HttpError(400, "Vérification anti-robot requise");
  }
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    signal: AbortSignal.timeout(8000),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  if (!data.success) throw new HttpError(400, "Vérification anti-robot échouée");
}

const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Identifiant public aléatoire (cryptographique), 14 caractères ≈ 69 bits. */
export function randomSlug(length = 14): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  return out;
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function audit(actor: string | null, action: string, entity?: string, entityId?: string, meta?: unknown) {
  try {
    await q`INSERT INTO audit_log (actor, action, entity, entity_id, meta)
            VALUES (${actor}, ${action}, ${entity ?? null}, ${entityId ?? null}, ${meta ? JSON.stringify(meta) : null}::jsonb)`;
  } catch (e) {
    console.error("[audit]", e);
  }
}
