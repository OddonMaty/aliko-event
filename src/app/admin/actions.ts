"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { q } from "@/lib/db";
import { isUuid } from "@/lib/invitations";
import { settleOrder, type OrderRow } from "@/lib/orders";
import { deletePhotos } from "@/lib/purge";
import { audit } from "@/lib/security";

function id(fd: FormData, key: string): string {
  const v = String(fd.get(key) ?? "");
  if (!isUuid(v)) throw new Error("Identifiant invalide");
  return v;
}

export async function moderateInvitation(fd: FormData) {
  const admin = await requireAdmin();
  const invId = id(fd, "invitationId");
  const action = String(fd.get("action") ?? "");

  if (action === "suspend") {
    await q`UPDATE invitations SET status = 'suspended', updated_at = now() WHERE id = ${invId} AND status IN ('draft','published')`;
    await q`UPDATE abuse_reports SET status = 'reviewed' WHERE invitation_id = ${invId} AND status = 'open'`;
  } else if (action === "restore") {
    await q`UPDATE invitations SET status = CASE WHEN published_at IS NOT NULL THEN 'published' ELSE 'draft' END, updated_at = now()
            WHERE id = ${invId} AND status = 'suspended'`;
  } else if (action === "dismiss") {
    await q`UPDATE abuse_reports SET status = 'dismissed' WHERE invitation_id = ${invId} AND status = 'open'`;
  } else if (action === "delete") {
    await deletePhotos(invId);
    await q`DELETE FROM invitations WHERE id = ${invId}`;
  } else {
    throw new Error("Action inconnue");
  }
  await audit(admin.id, `admin.invitation.${action}`, "invitation", invId);
  revalidatePath("/admin", "layout");
}

export async function updateUser(fd: FormData) {
  const admin = await requireAdmin();
  const userId = id(fd, "userId");
  const action = String(fd.get("action") ?? "");
  if (userId === admin.id) throw new Error("Vous ne pouvez pas modifier votre propre compte ici");

  if (action === "make_admin") await q`UPDATE users SET role = 'admin' WHERE id = ${userId}`;
  else if (action === "remove_admin") await q`UPDATE users SET role = 'customer' WHERE id = ${userId}`;
  else if (action === "disable") await q`UPDATE users SET disabled_at = now() WHERE id = ${userId} AND role = 'customer'`;
  else if (action === "enable") await q`UPDATE users SET disabled_at = NULL WHERE id = ${userId}`;
  else throw new Error("Action inconnue");
  await audit(admin.id, `admin.user.${action}`, "user", userId);
  revalidatePath("/admin/utilisateurs");
}

export async function updateOrder(fd: FormData) {
  const admin = await requireAdmin();
  const orderId = id(fd, "orderId");
  const action = String(fd.get("action") ?? "");

  if (action === "check") {
    // Réconciliation avec FlexPay : c'est lui qui fait foi, jamais un simple clic.
    const rows = await q<OrderRow>`
      SELECT id, user_id, reference, flexpay_order_number, amount, currency, status, created_at FROM orders WHERE id = ${orderId}`;
    if (rows[0]) await settleOrder(rows[0]);
  } else if (action === "refund") {
    // Le remboursement lui-même se fait chez le prestataire ; ici on le consigne et on retire l'invitation.
    await q`UPDATE orders SET status = 'refunded' WHERE id = ${orderId} AND status = 'paid'`;
    await q`UPDATE invitations SET status = 'suspended', updated_at = now() WHERE order_id = ${orderId} AND status IN ('draft','published')`;
  } else {
    throw new Error("Action inconnue");
  }
  await audit(admin.id, `admin.order.${action}`, "order", orderId);
  revalidatePath("/admin", "layout");
}

/** Supprime les brouillons jamais publiés et inactifs depuis 180 jours (avec leurs photos). */
export async function purgeStaleDrafts() {
  const admin = await requireAdmin();
  const rows = await q<{ id: string }>`
    SELECT id FROM invitations WHERE status = 'draft' AND published_at IS NULL AND updated_at < now() - interval '180 days' LIMIT 100`;
  for (const r of rows) {
    await deletePhotos(r.id);
    await q`DELETE FROM invitations WHERE id = ${r.id}`;
  }
  await audit(admin.id, "admin.purge_stale_drafts", undefined, undefined, { count: rows.length });
  revalidatePath("/admin/systeme");
}
