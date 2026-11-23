import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { InvitationView } from "@/components/invitation/invitation-view";
import { PurchasePanel } from "@/components/purchase-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCategory } from "@/lib/catalog";
import { sampleContent } from "@/lib/content";
import { getTemplate } from "@/lib/templates";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ categorie?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = getTemplate(id);
  return { title: t ? `Design « ${t.name} »` : "Design introuvable" };
}

export default async function TemplatePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { categorie } = await searchParams;
  const template = getTemplate(id);
  if (!template) notFound();

  const categories = template.categories.map((c) => getCategory(c)!).filter(Boolean);
  const initial = categories.find((c) => c.id === categorie) ?? categories[0];
  // Aperçu avec un contenu d'exemple (date factice pour la démonstration).
  const demo = { ...sampleContent(initial.id), date: "2027-06-12" };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:py-10 lg:pb-10">
        <Link href="/modeles" className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> Tous les modèles
        </Link>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-semibold">{template.name}</h1>
              <p className="text-muted-foreground mt-2">{template.description}</p>
            </div>
            <div className="mx-auto max-w-md overflow-hidden rounded-2xl border shadow-xl">
              <InvitationView content={demo} template={template} brand={false} embedded />
            </div>
            <p className="text-muted-foreground mt-3 text-center text-xs">Aperçu avec un texte d'exemple. Tout est modifiable après l'achat.</p>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <PurchasePanel
              templateId={template.id}
              initialCategory={initial.id}
              categories={categories.map((c) => ({ id: c.id, label: c.label, prices: c.prices, extraGuestCents: c.extraGuestCents }))}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
