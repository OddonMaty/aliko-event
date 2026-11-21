import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TemplateCard } from "@/components/template-card";
import { Button } from "@/components/ui/button";
import { CATEGORIES, getCategory, type CategoryId } from "@/lib/catalog";
import { TEMPLATES, templatesForCategory } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Modèles d'invitations",
  description: "Parcourez nos designs d'invitations numériques par type d'événement.",
};

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ categorie?: string }> }) {
  const { categorie } = await searchParams;
  const category = categorie ? getCategory(categorie) : undefined;
  const list = category ? templatesForCategory(category.id) : TEMPLATES;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {category ? category.label : "Tous nos modèles"}
          </h1>
          <p className="text-muted-foreground mt-3">
            {category ? category.tagline : "Choisissez le design qui vous ressemble, puis personnalisez-le en quelques minutes."}
          </p>
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          <Button asChild size="sm" variant={category ? "outline" : "default"}>
            <Link href="/modeles">Tous</Link>
          </Button>
          {CATEGORIES.map((c) => (
            <Button key={c.id} asChild size="sm" variant={category?.id === c.id ? "default" : "outline"}>
              <Link href={`/modeles?categorie=${c.id}`}>{c.label}</Link>
            </Button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TemplateCard key={t.id} template={t} category={category?.id as CategoryId | undefined} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
