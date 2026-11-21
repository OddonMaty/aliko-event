import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth";
import { CATEGORY_IDS, getCategory, priceUsdCents, TIERS, TIER_INFO } from "@/lib/catalog";
import { sampleContent } from "@/lib/content";
import { getSql, q } from "@/lib/db";
import { FlexpayError, normalizeDrcPhone, requestCardPayment, requestMobilePayment } from "@/lib/flexpay";
import { handle, json, readJson } from "@/lib/http";
import { flexpayAmount, toMinorAmount } from "@/lib/money";
import { assertSameOrigin, audit, HttpError, rateLimit, randomSlug } from "@/lib/security";
import { getTemplate } from "@/lib/templates";
import { appUrl } from "@/lib/utils";

const schema = z.object({
  templateId: z.string().max(50),
  category: z.enum(CATEGORY_IDS),
  tier: z.enum(TIERS),
  method: z.enum(["mobile", "card"]),
  currency: z.enum(["USD", "CDF"]),
  phone: z.string().max(30).optional().default(""),
});

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`checkout:${user.id}`, 8, 3600);

  const body = schema.parse(await readJson(req));
  const template = getTemplate(body.templateId);
  if (!template || !template.categories.includes(body.category)) throw new HttpError(400, "Design indisponible pour cette catégorie");
  const category = getCategory(body.category)!;

  // Le prix est TOUJOURS calculé côté serveur (jamais envoyé par le navigateur).
  const usdCents = priceUsdCents(body.category, body.tier);
  const amount = toMinorAmount(usdCents, body.currency);

  let phone: string | null = null;
  if (body.method === "mobile") {
    phone = normalizeDrcPhone(body.phone);
    if (!phone) throw new HttpError(400, "Numéro Mobile Money invalide (ex. 0990000000)");
  }

  const orderId = randomUUID();
  const invitationId = randomUUID();
  const reference = `AE-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`.toUpperCase();
  const slug = randomSlug();
  const content = JSON.stringify(sampleContent(body.category));

  const sql = getSql();
  await sql.transaction([
    sql`INSERT INTO orders (id, user_id, template_id, category, tier, amount_usd_cents, currency, amount, payment_method, phone, reference)
        VALUES (${orderId}, ${user.id}, ${body.templateId}, ${body.category}, ${body.tier}, ${usdCents}, ${body.currency}, ${amount}, ${body.method}, ${phone}, ${reference})`,
    sql`INSERT INTO invitations (id, order_id, user_id, slug, template_id, category, tier, status, content)
        VALUES (${invitationId}, ${orderId}, ${user.id}, ${slug}, ${body.templateId}, ${body.category}, ${body.tier}, 'awaiting_payment', ${content}::jsonb)`,
  ]);
  await audit(user.id, "order.created", "order", orderId, { tier: body.tier, category: body.category, currency: body.currency });

  const callbackSecret = process.env.FLEXPAY_CALLBACK_SECRET;
  if (!callbackSecret) throw new Error("FLEXPAY_CALLBACK_SECRET manquant");
  const base = appUrl();
  const callbackUrl = `${base}/api/flexpay/callback?t=${encodeURIComponent(callbackSecret)}`;
  const returnUrl = `${base}/acheter/retour?order=${orderId}`;
  const flexAmount = flexpayAmount(amount, body.currency);

  try {
    if (body.method === "mobile") {
      const res = await requestMobilePayment({ reference, phone: phone!, amount: flexAmount, currency: body.currency, callbackUrl });
      await q`UPDATE orders SET flexpay_order_number = ${res.orderNumber} WHERE id = ${orderId}`;
      return json({ orderId, next: `/acheter/retour?order=${orderId}` });
    }
    const res = await requestCardPayment({
      reference,
      amount: flexAmount,
      currency: body.currency,
      description: `Invitation ${category.label} (${TIER_INFO[body.tier].label}) - Aliko Event`,
      callbackUrl,
      approveUrl: returnUrl,
      cancelUrl: `${returnUrl}&r=cancel`,
      declineUrl: `${returnUrl}&r=decline`,
    });
    if (res.orderNumber) await q`UPDATE orders SET flexpay_order_number = ${res.orderNumber} WHERE id = ${orderId}`;
    return json({ orderId, redirectUrl: res.url });
  } catch (e) {
    await q`UPDATE orders SET status = 'failed' WHERE id = ${orderId} AND status = 'pending'`;
    await audit(user.id, "order.provider_error", "order", orderId, { message: e instanceof Error ? e.message : String(e) });
    if (e instanceof FlexpayError) throw new HttpError(502, e.message);
    throw new HttpError(502, "Le service de paiement est momentanément indisponible. Réessayez.");
  }
});
