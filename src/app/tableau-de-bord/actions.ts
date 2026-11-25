"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { esc, layout, button, sendEmail } from "@/lib/email";
import { isUuid } from "@/lib/invitations";
import { deletePhotos } from "@/lib/purge";
import { audit } from "@/lib/security";
import { appUrl } from "@/lib/utils";

/** Supprime (ou annule, si le paiement n'a pas eu lieu) une invitation de l'utilisateur connecté. */
export async function deleteMyInvitation(fd: FormData) {
  const user = await requireUser("/tableau-de-bord");
  const invId = String(fd.get("invitationId") ?? "");
  if (!isUuid(invId)) throw new Error("Identifiant invalide");

  const [inv] = await q<{ id: string; status: string; order_id: string }>`
    SELECT id, status, order_id FROM invitations WHERE id = ${invId} AND user_id = ${user.id}`;
  if (!inv) throw new Error("Invitation introuvable");

  // Une invitation suspendue par la modération ne peut pas être supprimée par son propriétaire (elle sert de preuve).
  if (inv.status === "suspended") throw new Error("Cette invitation est suspendue : contactez le support.");

  if (inv.status === "awaiting_payment") {
    await q`UPDATE orders SET status = 'cancelled' WHERE id = ${inv.order_id} AND status IN ('pending','failed')`;
  }
  let paidRef: string | null = null;
  if (inv.status !== "awaiting_payment") {
    // Commande payée : on la signale à l'admin (remboursement éventuel).
    const o = await q<{ reference: string; payment_method: string }>`
      UPDATE orders SET invitation_deleted_at = now() WHERE id = ${inv.order_id} AND status = 'paid' RETURNING reference, payment_method`;
    if (o[0] && o[0].payment_method !== "test") paidRef = o[0].reference;
  }
  await deletePhotos(inv.id);
  // Les réponses, invités et mots doux partent avec l'invitation (ON DELETE CASCADE). La commande reste pour la comptabilité.
  await q`DELETE FROM invitations WHERE id = ${inv.id} AND user_id = ${user.id}`;
  await audit(user.id, inv.status === "awaiting_payment" ? "invitation.cancel" : "invitation.delete", "invitation", inv.id);
  if (paidRef) {
    try {
      const admins = await q<{ email: string }>`SELECT email FROM users WHERE role = 'admin' AND disabled_at IS NULL`;
      const html = layout("Invitation supprimée par un client", `<p>${esc(user.name)} (${esc(user.email)}) a supprimé une invitation payée. Référence de la commande : <strong>${esc(paidRef)}</strong>.</p><p>Décidez s'il faut rembourser le client.</p>${button(`${appUrl()}/admin/commandes?q=${encodeURIComponent(paidRef)}`, "Ouvrir la commande")}`);
      await Promise.all(admins.map((a) => sendEmail(a.email, "Invitation supprimée : remboursement à examiner", html)));
    } catch {
      /* la suppression ne doit pas échouer à cause d'un e-mail */
    }
  }
  revalidatePath("/tableau-de-bord");
}
