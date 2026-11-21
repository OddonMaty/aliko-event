import { requireApiUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { handle, json } from "@/lib/http";
import { settleOrder, type OrderRow } from "@/lib/orders";
import { HttpError, rateLimit } from "@/lib/security";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Statut d'une commande (interrogé toutes les quelques secondes par la page de paiement).
// En cas de callback perdu, on réconcilie directement avec FlexPay.
export const GET = handle(async (_req, ctx) => {
  const user = await requireApiUser();
  const { id } = (await ctx.params) as { id: string };
  if (!UUID.test(id)) throw new HttpError(404, "Commande introuvable");
  await rateLimit(`order-poll:${user.id}`, 120, 600);

  const rows = await q<OrderRow>`
    SELECT id, user_id, reference, flexpay_order_number, amount, currency, status, created_at
    FROM orders WHERE id = ${id} AND user_id = ${user.id}`;
  const order = rows[0];
  if (!order) throw new HttpError(404, "Commande introuvable");

  let status = order.status;
  if (status === "pending") {
    // Abandon : au-delà de 30 minutes sans confirmation, on clôture la tentative.
    if (Date.now() - new Date(order.created_at).getTime() > 30 * 60 * 1000) {
      await q`UPDATE orders SET status = 'cancelled' WHERE id = ${order.id} AND status = 'pending'`;
      status = "cancelled";
    } else {
      try {
        status = await settleOrder(order);
      } catch (e) {
        console.error("[orders] vérification FlexPay impossible", e);
      }
    }
  }

  const inv = await q<{ id: string }>`SELECT id FROM invitations WHERE order_id = ${order.id}`;
  return json({ status, invitationId: status === "paid" ? (inv[0]?.id ?? null) : null });
});
