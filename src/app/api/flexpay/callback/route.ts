import { q } from "@/lib/db";
import { handle, json } from "@/lib/http";
import { settleOrder, type OrderRow } from "@/lib/orders";
import { audit, safeEqual } from "@/lib/security";

// Webhook FlexPay. Trois protections :
//  1. un secret dans l'URL de callback (comparé en temps constant) ;
//  2. aucune confiance dans le contenu : on interroge FlexPay (API de vérification) avant d'activer ;
//  3. idempotence : le journal payment_events + la mise à jour conditionnelle évitent tout double traitement.

async function readBody(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) return (await req.json()) as Record<string, unknown>;
    const text = await req.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return Object.fromEntries(new URLSearchParams(text));
    }
  } catch {
    return {};
  }
}

function pick(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  const lower = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v) !== "") return String(v);
  }
  return undefined;
}

export const POST = handle(async (req) => {
  const secret = process.env.FLEXPAY_CALLBACK_SECRET ?? "";
  const given = new URL(req.url).searchParams.get("t") ?? "";
  if (!secret || !safeEqual(given, secret)) return json({ error: "Non autorisé" }, 401);

  const body = await readBody(req);
  const reference = pick(body, "reference");
  const orderNumber = pick(body, "orderNumber", "order_number");
  const code = pick(body, "code");
  const providerRef = pick(body, "provider_reference", "providerReference");

  await q`INSERT INTO payment_events (provider, event_key, payload)
          VALUES ('flexpay', ${`${orderNumber ?? reference ?? "?"}:${code ?? "?"}:${providerRef ?? ""}`}, ${JSON.stringify(body)}::jsonb)
          ON CONFLICT (event_key) DO NOTHING`;

  const rows = reference
    ? await q<OrderRow>`SELECT id, user_id, reference, flexpay_order_number, amount, currency, status, created_at
                        FROM orders WHERE reference = ${reference}`
    : orderNumber
      ? await q<OrderRow>`SELECT id, user_id, reference, flexpay_order_number, amount, currency, status, created_at
                          FROM orders WHERE flexpay_order_number = ${orderNumber}`
      : [];

  const order = rows[0];
  if (!order) {
    await audit("system", "callback.unknown_order", "callback", reference ?? orderNumber ?? "?", body);
    return json({ ok: true }); // 200 pour que FlexPay n'insiste pas ; rien n'est activé
  }

  await settleOrder(order, { orderNumber, allowFail: code !== undefined && code !== "0" });
  return json({ ok: true });
});
