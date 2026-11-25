"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin";
import { esc, layout, sendEmail } from "@/lib/email";
import { q } from "@/lib/db";
import { isUuid } from "@/lib/invitations";
import { settleOrder, type OrderRow } from "@/lib/orders";
import { deletePhotos } from "@/lib/purge";
import { audit } from "@/lib/security";
import { TIERS } from "@/lib/catalog";
import { defaultSettings, getSettings, saveSettings } from "@/lib/settings";

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
    const done = await q<{ reference: string; email: string; name: string }>`
      UPDATE orders o SET status = 'refunded' FROM users u
      WHERE o.id = ${orderId} AND o.status = 'paid' AND u.id = o.user_id
      RETURNING o.reference, u.email, u.name`;
    if (done[0]) {
      await sendEmail(done[0].email, "Votre remboursement", layout("Remboursement", `<p>Bonjour ${esc(done[0].name)}, votre commande <strong>${esc(done[0].reference)}</strong> est remboursée. Le délai d'arrivée dépend de votre opérateur ou de votre banque.</p>`)).catch(() => undefined);
    }
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

/* ───────── Réglages (prix, formules, boissons, sections) ───────── */

const num = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(",", ".").trim());
const cents = (v: FormDataEntryValue | null) => Math.round(num(v) * 100);

export async function updateSettings(fd: FormData) {
  const admin = await requireAdmin();
  const section = String(fd.get("section") ?? "");
  const next = structuredClone(await getSettings());

  if (section === "prix") {
    for (const id of Object.keys(next.prices)) {
      for (const t of TIERS) {
        const c = cents(fd.get(`price:${id}:${t}`));
        if (!Number.isFinite(c) || c < 100) throw new Error(`Prix invalide (${id}, ${t}) : minimum 1 $`);
        next.prices[id]![t] = c;
      }
      const extra = cents(fd.get(`extra:${id}`));
      if (!Number.isFinite(extra) || extra < 0) throw new Error(`Supplément invalide (${id})`);
      next.prices[id]!.extraGuestCents = extra;
    }
    const limits = String(fd.get("guestLimits") ?? "").split(/[\s,;]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);
    if (limits.length === 0) throw new Error("Indiquez au moins un palier d'invités");
    next.guestLimits = limits;
  } else if (section === "formules") {
    for (const t of TIERS) {
      next.tiers[t].maxPhotos = num(fd.get(`photos:${t}`));
      next.tiers[t].maxProgram = num(fd.get(`program:${t}`));
    }
  } else if (section === "boissons") {
    next.drinks.presets = String(fd.get("presets") ?? "").split("\n");
    next.drinks.max = num(fd.get("max"));
    next.drinks.defaults = next.drinks.presets.map((p) => p.trim()).filter((p) => fd.get(`default:${p}`) === "on");
  } else if (section === "invites") {
    next.sections.guestbook = fd.get("guestbook") === "on";
    next.sections.map = fd.get("map") === "on";
    next.sections.drinks = fd.get("drinks") === "on";
  } else if (section === "reset") {
    const fresh = defaultSettings();
    fresh.samples = (await getSettings()).samples; // les photos d'exemple ont leur propre page
    await saveSettings(fresh, admin.id);
    await audit(admin.id, "admin.settings.reset", "settings", "app");
    revalidatePath("/", "layout");
    redirect("/admin/reglages?saved=reset");
  } else {
    throw new Error("Section inconnue");
  }

  await saveSettings(next, admin.id);
  await audit(admin.id, `admin.settings.${section}`, "settings", "app");
  revalidatePath("/", "layout");
  redirect(`/admin/reglages?saved=${section}`);
}
