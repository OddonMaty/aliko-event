import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TemplateCard } from "@/components/template-card";
import { Button } from "@/components/ui/button";
import { loadCatalog } from "@/lib/settings";
import { CATEGORIES, getCategory, type CategoryId } from "@/lib/catalog";
import { TEMPLATES, templatesForCategory } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Modèles d'invitations",
  description: "Parcourez nos designs d'invitations numériques par type d'événement.",
};

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ categorie?: string }> }) {
  await loadCatalog();
  const { categorie } = await searchParams;
  const category = categorie ? getCategory(categorie) : undefined;
  const list = category ? templatesForCategory(category.id) : TEMPLATES;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-14">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl sm:text-6xl">
            {category ? category.label : "Tous nos modèles"}
          </h1>
          <p className="text-muted-foreground mt-3">
            {category ? category.tagline : "Choisissez le design qui vous ressemble, puis personnalisez-le en quelques minutes."}
          </p>
        </div>

        <div className="no-scrollbar bg-background/90 sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-5 mb-8 flex gap-2 overflow-x-auto px-5 py-3 backdrop-blur md:static md:mx-0 md:mb-10 md:flex-wrap md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
          <Button asChild size="sm" className="shrink-0" variant={category ? "outline" : "default"}>
            <Link href="/modeles">Tous</Link>
          </Button>
          {CATEGORIES.map((c) => (
            <Button key={c.id} asChild size="sm" className="shrink-0" variant={category?.id === c.id ? "default" : "outline"}>
              <Link href={`/modeles?categorie=${c.id}`}>{c.label}</Link>
            </Button>
          ))}
        </div>

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TemplateCard key={t.id} template={t} category={category?.id as CategoryId | undefined} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
