import { importJWK, SignJWT } from "jose";

import { q } from "@/lib/db";

// Notifications push (Web Push, VAPID) sans contenu chiffré : le serveur « réveille » l'appareil,
// et le service worker affiche un message générique. Aucune donnée d'invité ne transite par le service de push.

export function pushConfigured(): boolean {
  return !!(process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}

async function vapidHeader(endpoint: string): Promise<string> {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const raw = Buffer.from(pub, "base64url");
  const key = await importJWK(
    { kty: "EC", crv: "P-256", x: raw.subarray(1, 33).toString("base64url"), y: raw.subarray(33, 65).toString("base64url"), d: process.env.VAPID_PRIVATE_KEY! },
    "ES256",
  );
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", typ: "JWT" })
    .setAudience(new URL(endpoint).origin)
    .setSubject(`mailto:${process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] ?? process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@aliko.event"}`)
    .setExpirationTime("12h")
    .sign(key);
  return `vapid t=${jwt}, k=${pub}`;
}

/** Réveille tous les appareils de l'utilisateur. Ne lève jamais d'erreur. */
export async function sendPush(userId: string): Promise<void> {
  if (!pushConfigured()) return;
  try {
    const subs = await q<{ id: string; endpoint: string }>`SELECT id, endpoint FROM push_subscriptions WHERE user_id = ${userId}`;
    await Promise.all(
      subs.map(async (s) => {
        try {
          const res = await fetch(s.endpoint, {
            method: "POST",
            headers: { Authorization: await vapidHeader(s.endpoint), TTL: "86400", Urgency: "normal", "Content-Length": "0" },
            signal: AbortSignal.timeout(8000),
          });
          // Abonnement révoqué ou expiré : on le retire.
          if (res.status === 404 || res.status === 410) await q`DELETE FROM push_subscriptions WHERE id = ${s.id}`;
        } catch {
          /* appareil injoignable : on réessaiera à la prochaine notification */
        }
      }),
    );
  } catch {
    /* ignoré */
  }
}
