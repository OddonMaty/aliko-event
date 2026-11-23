import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Hourglass } from "lucide-react";

import { Editor, type MessageItem, type RsvpItem } from "@/components/editor";
import type { GuestItem } from "@/components/guest-manager";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { getOwnedInvitation, lastOnlineDay, parseStoredContent } from "@/lib/invitations";
import { getTemplate } from "@/lib/templates";
import { appUrl, formatDateFr } from "@/lib/utils";

export const metadata: Metadata = { title: "Personnaliser", robots: { index: false } };

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/tableau-de-bord/${id}`);

  let inv: Awaited<ReturnType<typeof getOwnedInvitation>>;
  try {
    inv = await getOwnedInvitation(id, user.id);
  } catch {
    notFound();
  }
  if (inv.status === "awaiting_payment") redirect(`/acheter/retour?order=${inv.order_id}`);
  const template = getTemplate(inv.template_id);
  if (!template) notFound();

  const rsvps = await q<{
    id: string; name: string; phone: string | null; email: string | null; attendance: "yes" | "no" | "maybe";
    party_size: number; drink: string | null; message: string | null; created_at: Date;
  }>`SELECT id, name, phone, email, attendance, party_size, drink, message, created_at
     FROM rsvps WHERE invitation_id = ${inv.id} ORDER BY created_at DESC LIMIT 1000`;
  const items: RsvpItem[] = rsvps.map((r) => ({ ...r, created_at: new Date(r.created_at).toISOString() }));

  const guestRows = await q<{ id: string; name: string; token: string; attendance: "yes" | "no" | "maybe" | null; checked_in: boolean }>`
    SELECT g.id, g.name, g.token, r.attendance, (g.checked_in_at IS NOT NULL) AS checked_in
    FROM guests g LEFT JOIN rsvps r ON r.guest_id = g.id
    WHERE g.invitation_id = ${inv.id} ORDER BY g.created_at ASC LIMIT 1000`;
  const guests: GuestItem[] = guestRows.map((g) => ({ id: g.id, name: g.name, token: g.token, attendance: g.attendance, checkedIn: g.checked_in }));

  const messageRows = await q<{ id: string; name: string; message: string; created_at: Date }>`
    SELECT id, name, message, created_at FROM guestbook
    WHERE invitation_id = ${inv.id} AND hidden = false ORDER BY created_at DESC LIMIT 200`;
  const messages: MessageItem[] = messageRows.map((m) => ({ ...m, created_at: new Date(m.created_at).toISOString() }));

  const content = parseStoredContent(inv.content);
  const lastDay = content.date ? lastOnlineDay(content.date) : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/tableau-de-bord" className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> Mes invitations
        </Link>
        {lastDay && (
          <div className="bg-accent/40 mb-6 flex items-start gap-3 rounded-lg border p-3.5 text-sm">
            <Hourglass className="text-primary mt-0.5 size-4 shrink-0" />
            <p>
              Votre invitation reste en ligne jusqu&apos;au <strong>{formatDateFr(lastDay, "long")}</strong> à minuit. Elle est ensuite supprimée
              automatiquement, avec la liste des invités et leurs réponses. Téléchargez-les avant si besoin.
            </p>
          </div>
        )}
        <Editor
          invitation={{ id: inv.id, slug: inv.slug, status: inv.status as "draft" | "published" | "suspended" | "archived", tier: inv.tier, guestLimit: inv.guest_limit }}
          template={template}
          initialContent={content}
          rsvps={items}
          guests={guests}
          messages={messages}
          baseUrl={appUrl()}
        />
      </main>
    </>
  );
}
