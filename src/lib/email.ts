import { appUrl } from "@/lib/utils";

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function emailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Cadre commun des e-mails : sobre, lisible, sans image externe. */
export function layout(title: string, body: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
<p style="font-size:20px;margin:0 0 16px"><strong style="color:#a8842c">Aliko Event</strong></p>
<h1 style="font-size:18px;margin:0 0 12px">${esc(title)}</h1>
${body}
<p style="color:#888;font-size:12px;margin-top:28px">Vous recevez ce message parce que vous avez un compte sur ${esc(appUrl().replace(/^https?:\/\//, ""))}.</p>
</div>`;
}

export function button(href: string, label: string): string {
  return `<p style="margin:20px 0"><a href="${esc(href)}" style="background:#a8842c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">${esc(label)}</a></p>`;
}

/** Envoi via Resend. Renvoie false (sans lever d'erreur) si le service n'est pas configuré ou échoue. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error("[email]", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("[email]", e);
    return false;
  }
}
