"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { isUuid } from "@/lib/invitations";
import { deletePhotos } from "@/lib/purge";
import { audit } from "@/lib/security";

/** Supprime (ou annule, si le paiement n'a pas eu lieu) une invitation de l'utilisateur connecté. */
export async function deleteMyInvitation(fd: FormData) {
  const user = await requireUser("/tableau-de-bord");
  const invId = String(fd.get("invitationId") ?? "");
  if (!isUuid(invId)) throw new Error("Identifiant invalide");

  const [inv] = await q<{ id: string; status: string; order_id: string }>`
    SELECT id, status, order_id FROM invitations WHERE id = ${invId} AND user_id = ${user.id}`;
  if (!inv) throw new Error("Invitation introuvable");

  if (inv.status === "awaiting_payment") {
    await q`UPDATE orders SET status = 'cancelled' WHERE id = ${inv.order_id} AND status IN ('pending','failed')`;
  }
  await deletePhotos(inv.id);
  // Les réponses, invités et mots doux partent avec l'invitation (ON DELETE CASCADE). La commande reste pour la comptabilité.
  await q`DELETE FROM invitations WHERE id = ${inv.id} AND user_id = ${user.id}`;
  await audit(user.id, inv.status === "awaiting_payment" ? "invitation.cancel" : "invitation.delete", "invitation", inv.id);
  revalidatePath("/tableau-de-bord");
}
