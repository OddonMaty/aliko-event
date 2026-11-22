import QRCode from "qrcode";

import { q } from "@/lib/db";
import { isGuestToken } from "@/lib/guests";
import { handle } from "@/lib/http";
import { clientIp, hashIp, HttpError, rateLimit } from "@/lib/security";
import { appUrl } from "@/lib/utils";

// QR du pass personnel d'un invité : encode son lien personnel (?g=jeton), rien d'autre.
export const GET = handle(async (req, ctx) => {
  const { token } = (await ctx.params) as { token: string };
  if (!isGuestToken(token)) throw new HttpError(404, "Pass introuvable");
  await rateLimit(`pass-qr:${hashIp(clientIp(req))}`, 120, 600);

  const rows = await q<{ slug: string }>`
    SELECT i.slug FROM guests g JOIN invitations i ON i.id = g.invitation_id
    WHERE g.token = ${token} AND i.status = 'published' AND (i.expires_at IS NULL OR i.expires_at > now())`;
  if (!rows[0]) throw new HttpError(404, "Pass introuvable");

  const url = `${appUrl()}/i/${rows[0].slug}?g=${token}`;
  const sp = new URL(req.url).searchParams;
  const format = sp.get("format") === "svg" ? "svg" : "png";
  const disposition = sp.get("download") ? `attachment; filename="pass-invite.${format}"` : "inline";
  const opts = { errorCorrectionLevel: "H" as const, margin: 2, color: { dark: "#111111", light: "#ffffff" } };
  const headers = { "Content-Disposition": disposition, "Cache-Control": "private, max-age=300", "X-Robots-Tag": "noindex" };

  if (format === "png") {
    const buf = await QRCode.toBuffer(url, { ...opts, type: "png", width: 900 });
    return new Response(new Uint8Array(buf), { headers: { ...headers, "Content-Type": "image/png" } });
  }
  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml" } });
});
