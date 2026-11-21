import type { Metadata } from "next";
import { cache } from "react";

import { InvitationView } from "@/components/invitation/invitation-view";
import { ReportButton } from "@/components/report-button";
import { RsvpForm } from "@/components/rsvp-form";
import { TIER_INFO, type Tier } from "@/lib/catalog";
import { isAllowedImageUrl } from "@/lib/content";
import { q } from "@/lib/db";
import { parseStoredContent } from "@/lib/invitations";
import { getTemplate } from "@/lib/templates";

// Page publique d'une invitation : jamais indexée par les moteurs de recherche.
type Props = { params: Promise<{ slug: string }> };

const load = cache(async (slug: string) => {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const rows = await q<{
    id: string; slug: string; template_id: string; tier: Tier; status: "published" | "suspended"; content: unknown; expires_at: Date | null;
  }>`SELECT id, slug, template_id, tier, status, content, expires_at
     FROM invitations WHERE slug = ${slug} AND status IN ('published','suspended')`;
  return rows[0] ?? null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const base: Metadata = { robots: { index: false, follow: false, nocache: true } };
  const inv = await load(slug).catch(() => null);
  if (!inv || inv.status !== "published") return { ...base, title: "Invitation" };
  const c = parseStoredContent(inv.content);
  const image = c.photos.find(isAllowedImageUrl);
  return {
    ...base,
    title: c.title,
    description: c.eyebrow || c.subtitle || "Vous êtes invité(e)",
    openGraph: { title: c.title, description: c.eyebrow || c.subtitle || "Vous êtes invité(e)", ...(image ? { images: [image] } : {}) },
  };
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{text}</p>
      </div>
    </main>
  );
}

export default async function InvitationPage({ params }: Props) {
  const { slug } = await params;
  const inv = await load(slug);

  if (!inv) return <Notice title="Invitation introuvable" text="Ce lien n'est pas valide. Vérifiez-le auprès de la personne qui vous a invité(e)." />;
  if (inv.status === "suspended") {
    return <Notice title="Invitation indisponible" text="Cette invitation a été suspendue. Si vous pensez qu'il s'agit d'une erreur, contactez l'organisateur." />;
  }
  if (inv.expires_at && new Date(inv.expires_at).getTime() < Date.now()) {
    return <Notice title="Invitation expirée" text="Cet événement est terminé. Merci d'être passé(e) !" />;
  }

  const template = getTemplate(inv.template_id);
  if (!template) return <Notice title="Invitation indisponible" text="Cette invitation n'est plus disponible." />;
  const content = parseStoredContent(inv.content);

  return (
    <main className="min-h-screen" style={{ background: template.palette.bg }}>
      <div className="mx-auto max-w-xl">
        <InvitationView content={content} template={template} brand={!TIER_INFO[inv.tier].brandingFree}>
          {content.rsvpEnabled && <RsvpForm slug={inv.slug} template={template} deadline={content.rsvpDeadline || undefined} />}
        </InvitationView>
        <ReportButton slug={inv.slug} color={template.palette.muted} />
      </div>
    </main>
  );
}
