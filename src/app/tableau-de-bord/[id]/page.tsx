import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Editor, type RsvpItem } from "@/components/editor";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { getOwnedInvitation, parseStoredContent } from "@/lib/invitations";
import { getTemplate } from "@/lib/templates";
import { appUrl } from "@/lib/utils";

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
    party_size: number; message: string | null; created_at: Date;
  }>`SELECT id, name, phone, email, attendance, party_size, message, created_at
     FROM rsvps WHERE invitation_id = ${inv.id} ORDER BY created_at DESC LIMIT 1000`;
  const items: RsvpItem[] = rsvps.map((r) => ({ ...r, created_at: new Date(r.created_at).toISOString() }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/tableau-de-bord" className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> Mes invitations
        </Link>
        <Editor
          invitation={{ id: inv.id, slug: inv.slug, status: inv.status as "draft" | "published" | "suspended" | "archived", tier: inv.tier }}
          template={template}
          initialContent={parseStoredContent(inv.content)}
          rsvps={items}
          baseUrl={appUrl()}
        />
      </main>
    </>
  );
}
