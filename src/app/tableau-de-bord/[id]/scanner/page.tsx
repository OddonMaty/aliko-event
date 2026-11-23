import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Scanner, type ScanGuest } from "@/components/scanner";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { getOwnedInvitation, parseStoredContent } from "@/lib/invitations";

export const metadata: Metadata = { title: "Scanner les entrées", robots: { index: false } };

export default async function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/tableau-de-bord/${id}/scanner`);

  let inv: Awaited<ReturnType<typeof getOwnedInvitation>>;
  try {
    inv = await getOwnedInvitation(id, user.id);
  } catch {
    notFound();
  }
  if (inv.status === "awaiting_payment") redirect(`/acheter/retour?order=${inv.order_id}`);
  const content = parseStoredContent(inv.content);

  const rows = await q<{ id: string; name: string; checked_in: boolean; party_size: number | null; attendance: string | null }>`
    SELECT g.id, g.name, (g.checked_in_at IS NOT NULL) AS checked_in, r.party_size, r.attendance
    FROM guests g LEFT JOIN rsvps r ON r.guest_id = g.id
    WHERE g.invitation_id = ${inv.id} ORDER BY g.name ASC LIMIT 1000`;
  const guests: ScanGuest[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    checkedIn: r.checked_in,
    party: r.attendance && r.attendance !== "no" ? r.party_size : null,
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href={`/tableau-de-bord/${inv.id}`} className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> Retour à l&apos;invitation
        </Link>
        <h1 className="text-3xl font-semibold">Entrées</h1>
        <p className="text-muted-foreground mt-1 mb-6 text-sm">{content.title}</p>
        {inv.status !== "published" && (
          <p className="bg-accent/40 mb-6 rounded-lg border p-3 text-sm">
            L&apos;invitation n&apos;est pas encore publiée : vos invités n&apos;ont pas reçu leur pass.
          </p>
        )}
        <Scanner invitationId={inv.id} initialGuests={guests} />
      </main>
    </>
  );
}
