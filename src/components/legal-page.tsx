import Link from "next/link";
import { FlaskConical } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Separator } from "@/components/ui/separator";
import { CONTACT_EMAIL, LEGAL_LINKS, LEGAL_UPDATED } from "@/lib/legal";
import { isTestPayments } from "@/lib/testmode";
import { cn } from "@/lib/utils";

export function LegalPage({ title, intro, current, children }: { title: string; intro: string; current: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Pages légales" className="flex flex-wrap gap-x-5 gap-y-2 text-sm lg:flex-col lg:gap-3">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={l.href === current ? "page" : undefined}
                className={cn("hover:text-foreground transition-colors", l.href === current ? "text-primary font-medium" : "text-muted-foreground")}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <article className="max-w-3xl">
          <h1 className="text-4xl sm:text-6xl">{title}</h1>
          <p className="text-muted-foreground mt-3 text-sm">Dernière mise à jour : {LEGAL_UPDATED}</p>
          <p className="mt-6 text-lg leading-relaxed">{intro}</p>
          {isTestPayments() && (
            <div className="bg-accent/40 mt-8 flex items-start gap-3 rounded-lg border p-4 text-sm">
              <FlaskConical className="text-primary mt-0.5 size-4 shrink-0" />
              <p>Aliko Event est actuellement en phase de test : les paiements sont simulés et aucun argent réel n&apos;est prélevé.</p>
            </div>
          )}
          <Separator className="my-10" />
          <div className="space-y-10">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-3xl">{title}</h2>
      <div className="text-muted-foreground space-y-4 leading-relaxed [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:text-foreground">{children}</div>
    </section>
  );
}

export function ContactLine() {
  return CONTACT_EMAIL ? (
    <p>
      Pour toute question, écrivez-nous à{" "}
      <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline-offset-4 hover:underline">
        {CONTACT_EMAIL}
      </a>
      .
    </p>
  ) : (
    <p>L&apos;adresse de contact du support sera communiquée sur le site dès l&apos;ouverture officielle du service.</p>
  );
}
