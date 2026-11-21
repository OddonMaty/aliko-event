import QRCode from "qrcode";

import { requireApiUser } from "@/lib/auth";
import { handle } from "@/lib/http";
import { getOwnedInvitation } from "@/lib/invitations";
import { appUrl } from "@/lib/utils";

// QR code de l'invitation (lien public). Généré côté serveur ; ne contient que l'URL.
export const GET = handle(async (req, ctx) => {
  const user = await requireApiUser();
  const { id } = (await ctx.params) as { id: string };
  const inv = await getOwnedInvitation(id, user.id);

  const url = `${appUrl()}/i/${inv.slug}`;
  const sp = new URL(req.url).searchParams;
  const format = sp.get("format") === "png" ? "png" : "svg";
  const disposition = sp.get("download") ? `attachment; filename="aliko-qr-${inv.slug}.${format}"` : "inline";
  const opts = { errorCorrectionLevel: "H" as const, margin: 2, color: { dark: "#111111", light: "#ffffff" } };

  if (format === "png") {
    const buf = await QRCode.toBuffer(url, { ...opts, type: "png", width: 1024 });
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": disposition, "Cache-Control": "private, max-age=300" },
    });
  }
  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Content-Disposition": disposition, "Cache-Control": "private, max-age=300" },
  });
});
