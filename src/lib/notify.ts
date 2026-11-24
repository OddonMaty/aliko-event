import { q } from "@/lib/db";
import { appUrl } from "@/lib/utils";

export interface RsvpPayload {
  name: string;
  phone: string | null;
  email: string | null;
  attendance: "yes" | "no" | "maybe";
  partySize: number;
  message: string | null;
  drink: string | null;
}

const ATT = { yes: "sera présent(e)", no: "ne pourra pas venir", maybe: "n'est pas sûr(e) de venir" } as const;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function owner(invitationId: string) {
  const r = await q<{ user_id: string; email: string; title: string }>`
    SELECT i.user_id, u.email, COALESCE(i.content->>'title', 'Votre invitation') AS title
    FROM invitations i JOIN users u ON u.id = i.user_id WHERE i.id = ${invitationId}`;
  return r[0];
}

/** Envoi facultatif par e-mail (Resend). Ne fait rien tant que RESEND_API_KEY et EMAIL_FROM ne sont pas définis. */
async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
}

/** Ne doit jamais faire échouer la réponse de l'invité : toute erreur est ignorée. */
export async function notifyRsvp(invitationId: string, rsvp: RsvpPayload, updated: boolean) {
  try {
    const o = await owner(invitationId);
    if (!o) return;
    const title = `${rsvp.name} ${ATT[rsvp.attendance]}`;
    await q`INSERT INTO notifications (user_id, invitation_id, kind, title, payload)
            VALUES (${o.user_id}, ${invitationId}, ${updated ? "rsvp_update" : "rsvp"}, ${title}, ${JSON.stringify(rsvp)}::jsonb)`;
    const row = (l: string, v: string | number | null) => (v ? `<tr><td style="padding:4px 12px 4px 0;color:#666">${l}</td><td><strong>${esc(String(v))}</strong></td></tr>` : "");
    await sendEmail(
      o.email,
      `${updated ? "Réponse modifiée" : "Nouvelle réponse"} : ${rsvp.name} (${o.title})`,
      `<p>${esc(title)} — ${esc(o.title)}</p><table>${row("Nom", rsvp.name)}${row("Réponse", ATT[rsvp.attendance])}${row("Personnes", rsvp.partySize)}${row("Téléphone", rsvp.phone)}${row("E-mail", rsvp.email)}${row("Boisson", rsvp.drink)}${row("Message", rsvp.message)}</table><p><a href="${appUrl()}/notifications">Voir toutes les réponses</a></p>`,
    );
  } catch {
    /* ignoré */
  }
}

export async function notifyGuestbook(invitationId: string, name: string, message: string) {
  try {
    const o = await owner(invitationId);
    if (!o) return;
    await q`INSERT INTO notifications (user_id, invitation_id, kind, title, payload)
            VALUES (${o.user_id}, ${invitationId}, 'guestbook', ${`${name} a laissé un mot doux`}, ${JSON.stringify({ name, message })}::jsonb)`;
  } catch {
    /* ignoré */
  }
}

export async function unreadCount(userId: string): Promise<number> {
  try {
    const r = await q<{ n: number }>`SELECT count(*)::int AS n FROM notifications WHERE user_id = ${userId} AND read_at IS NULL`;
    return r[0]?.n ?? 0;
  } catch {
    return 0;
  }
}
