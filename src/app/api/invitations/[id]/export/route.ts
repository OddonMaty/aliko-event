import { requireApiUser } from "@/lib/auth";
import { TIER_INFO } from "@/lib/catalog";
import { q } from "@/lib/db";
import { handle } from "@/lib/http";
import { getOwnedInvitation } from "@/lib/invitations";
import { HttpError } from "@/lib/security";

// Protège contre l'injection de formules (Excel) : préfixe les cellules dangereuses.
function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export const GET = handle(async (_req, ctx) => {
  const user = await requireApiUser();
  const { id } = (await ctx.params) as { id: string };
  const inv = await getOwnedInvitation(id, user.id);
  if (!TIER_INFO[inv.tier].csv) throw new HttpError(403, "L'export est disponible à partir du palier Standard");

  const rows = await q<{
    name: string; phone: string | null; email: string | null; attendance: string; party_size: number; message: string | null; created_at: Date;
  }>`SELECT name, phone, email, attendance, party_size, message, created_at FROM rsvps
     WHERE invitation_id = ${inv.id} ORDER BY created_at ASC`;

  const label: Record<string, string> = { yes: "Présent", no: "Absent", maybe: "Peut-être" };
  const lines = [
    ["Nom", "Téléphone", "Email", "Réponse", "Personnes", "Message", "Date"].map(cell).join(";"),
    ...rows.map((r) =>
      [r.name, r.phone, r.email, label[r.attendance] ?? r.attendance, r.party_size, r.message, new Date(r.created_at).toISOString()]
        .map(cell)
        .join(";"),
    ),
  ];
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reponses-${inv.slug}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
});
