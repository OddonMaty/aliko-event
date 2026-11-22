import { z } from "zod";

import { requireApiUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { handle, json, readJson } from "@/lib/http";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";
import { assertSameOrigin, HttpError, rateLimit } from "@/lib/security";
import { isTestPayments } from "@/lib/testmode";

const schema = z.object({ orderId: z.string().uuid(), outcome: z.enum(["success", "failure"]) });

// Simulation de paiement (tests). Refusée dès que PAYMENT_MODE n'est pas « test ».
export const POST = handle(async (req) => {
  if (!isTestPayments()) throw new HttpError(404, "Introuvable");
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`test-payment:${user.id}`, 30, 3600);

  const { orderId, outcome } = schema.parse(await readJson(req));
  const rows = await q<{ id: string }>`
    SELECT id FROM orders
    WHERE id = ${orderId} AND user_id = ${user.id} AND payment_method = 'test' AND status = 'pending'`;
  if (!rows[0]) throw new HttpError(404, "Commande de test introuvable ou déjà traitée");

  if (outcome === "success") await markOrderPaid(orderId, "TEST");
  else await markOrderFailed(orderId);
  return json({ ok: true });
});
