import Link from "next/link";

import { InvitationCover } from "@/components/invitation/invitation-view";
import { Badge } from "@/components/ui/badge";
import { getCategory, type CategoryId } from "@/lib/catalog";
import { sampleContent } from "@/lib/content";
import type { Template } from "@/lib/templates";

/** Carte de la galerie : aperçu réel du design (couverture) avec un contenu d'exemple. */
export function TemplateCard({ template, category }: { template: Template; category?: CategoryId }) {
  const cat = category ?? template.categories[0];
  const content = sampleContent(cat);
  const href = `/modeles/${template.id}${category ? `?categorie=${category}` : ""}`;
  return (
    <Link href={href} className="group block">
      <div className="bg-card overflow-hidden rounded-xl border transition-shadow group-hover:shadow-lg">
        <div className="relative h-[420px] overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 origin-top scale-[0.82]" aria-hidden>
            <div className="mx-auto w-[122%] -translate-x-[10%]">
              <InvitationCover content={content} template={template} />
            </div>
          </div>
          <div className="from-card absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
        </div>
        <div className="space-y-2 border-t p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{template.name}</h3>
            <span className="text-primary text-sm opacity-0 transition-opacity group-hover:opacity-100">Voir →</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {template.categories.slice(0, 3).map((c) => (
              <Badge key={c} variant="secondary">
                {getCategory(c)?.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
