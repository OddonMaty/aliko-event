import { getSql, q } from "./db";
import { audit } from "./security";
import { checkTransaction } from "./flexpay";
import { flexpayAmount, type Currency } from "./money";

// Règle d'or : seule CETTE fonction (côté serveur) peut passer une commande à « payée »,
// et uniquement après avoir interrogé FlexPay directement (le callback seul ne suffit jamais).

export interface OrderRow {
  id: string;
  user_id: string;
  reference: string;
  flexpay_order_number: string | null;
  amount: number;
  currency: Currency;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  created_at: Date;
}

export async function markOrderPaid(orderId: string, providerRef?: string) {
  const sql = getSql();
  await sql.transaction([
    sql`UPDATE orders
        SET status = 'paid', paid_at = COALESCE(paid_at, now()), provider_reference = COALESCE(${providerRef ?? null}, provider_reference)
        WHERE id = ${orderId} AND status IN ('pending','failed','cancelled')`,
    sql`UPDATE invitations SET status = 'draft', updated_at = now()
        WHERE order_id = ${orderId} AND status = 'awaiting_payment'
          AND EXISTS (SELECT 1 FROM orders o WHERE o.id = ${orderId} AND o.status = 'paid')`,
  ]);
  await audit("system", "order.paid", "order", orderId);
}

export async function markOrderFailed(orderId: string) {
  await q`UPDATE orders SET status = 'failed' WHERE id = ${orderId} AND status = 'pending'`;
  await audit("system", "order.failed", "order", orderId);
}

/**
 * Réconcilie une commande avec FlexPay.
 * @param allowFail  true uniquement depuis le callback (un « statut 1 » n'est pas fiable pour un paiement encore en cours).
 */
export async function settleOrder(
  order: OrderRow,
  opts: { orderNumber?: string; allowFail?: boolean } = {},
): Promise<OrderRow["status"]> {
  if (order.status === "paid") return "paid";

  const orderNumber = order.flexpay_order_number ?? opts.orderNumber;
  if (!orderNumber) return order.status;

  // Rattache le numéro de commande FlexPay (cas du paiement par carte, connu seulement au callback)
  if (!order.flexpay_order_number && opts.orderNumber) {
    await q`UPDATE orders SET flexpay_order_number = ${opts.orderNumber}
            WHERE id = ${order.id} AND flexpay_order_number IS NULL`;
  }

  const tx = await checkTransaction(orderNumber);
  if (!tx) return order.status;

  if (tx.reference && tx.reference !== order.reference) {
    await audit("system", "order.reference_mismatch", "order", order.id, { orderNumber, got: tx.reference });
    return order.status;
  }

  if (tx.status === 0) {
    const expected = flexpayAmount(order.amount, order.currency);
    const currencyOk = !tx.currency || tx.currency === order.currency;
    const amountOk = tx.amount === undefined || tx.amount + 0.0001 >= expected;
    if (!currencyOk || !amountOk) {
      await audit("system", "order.amount_mismatch", "order", order.id, { expected, tx });
      return order.status;
    }
    await markOrderPaid(order.id);
    return "paid";
  }

  if (tx.status === 1 && opts.allowFail) {
    await markOrderFailed(order.id);
    return "failed";
  }
  return order.status;
}
