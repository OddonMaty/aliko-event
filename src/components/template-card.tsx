import Link from "next/link";

import { InvitationCover } from "@/components/invitation/invitation-view";
import { getCategory, type CategoryId } from "@/lib/catalog";
import { sampleContent } from "@/lib/content";
import type { Template } from "@/lib/templates";

/** Carte de la galerie : aperçu réel du design (couverture) avec un contenu d'exemple. */
export function TemplateCard({ template, category }: { template: Template; category?: CategoryId }) {
  const cat = category ?? template.categories[0];
  const content = sampleContent(cat);
  const href = `/modeles/${template.id}${category ? `?categorie=${category}` : ""}`;
  const labels = template.categories
    .slice(0, 3)
    .map((c) => getCategory(c)?.label)
    .filter(Boolean)
    .join(", ");
  return (
    <Link href={href} className="group block outline-none">
      <div className="ring-border group-hover:ring-primary/60 group-focus-visible:ring-primary relative aspect-[3/4] sm:aspect-auto sm:h-[440px] overflow-hidden rounded-sm ring-1 transition-[box-shadow,transform] duration-300 group-hover:-translate-y-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 origin-top scale-[0.82]" aria-hidden>
          <div className="mx-auto w-[122%] -translate-x-[10%]">
            <InvitationCover content={content} template={template} />
          </div>
        </div>
      </div>
      <div className="mt-2.5 sm:mt-4 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
        <h3 className="truncate font-serif text-lg leading-tight sm:text-2xl sm:leading-none">{template.name}</h3>
        <p className="text-muted-foreground mt-0.5 truncate text-xs sm:mt-0 sm:text-sm">{labels}</p>
      </div>
    </Link>
  );
}
