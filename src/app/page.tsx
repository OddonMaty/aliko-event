import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { InvitationCover } from "@/components/invitation/invitation-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TemplateCard } from "@/components/template-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CATEGORIES, minPriceForTier, TIERS, TIER_INFO } from "@/lib/catalog";
import { sampleContent } from "@/lib/content";
import { formatUsdCents } from "@/lib/money";
import { getTemplate, TEMPLATES, templatesForCategory } from "@/lib/templates";

const STEPS = [
  { title: "Choisissez", text: "Le type d'événement, puis le design qui vous ressemble." },
  { title: "Payez une fois", text: "Par Mobile Money ou par carte. Aucun abonnement." },
  { title: "Personnalisez", text: "Vos textes, vos photos, le lieu et le programme de la journée." },
  { title: "Partagez", text: "Vous recevez un lien et un QR code. Chaque invité peut avoir le sien." },
];

const FAQ = [
  { q: "Faut-il un abonnement ?", a: "Non. Vous payez une seule fois, par invitation, selon l'événement et la formule choisie." },
  { q: "Comment payer ?", a: "Par Mobile Money (M-Pesa, Airtel Money ou Orange Money) ou par carte bancaire, en dollars ou en francs congolais." },
  { q: "Mes invités doivent-ils créer un compte ?", a: "Non. Ils ouvrent le lien, voient l'invitation et confirment leur présence en quelques secondes." },
  { q: "Puis-je modifier mon invitation après l'avoir publiée ?", a: "Oui. Vos modifications apparaissent immédiatement sur le même lien, sans le renvoyer." },
  { q: "Mon invitation est-elle protégée ?", a: "Votre lien est unique et impossible à deviner, les moteurs de recherche ne le référencent pas, et seul vous voyez les réponses de vos invités." },
  { q: "Combien de temps reste-t-elle en ligne ?", a: "Jusqu'à 30 jours après la date de votre événement." },
];

const TRUST = [
  { title: "Paiement vérifié", text: "Votre invitation n'est activée qu'une fois le paiement confirmé par FlexPay." },
  { title: "Lien impossible à deviner", text: "Personne ne peut tomber sur votre invitation par hasard, ni la retrouver sur Google." },
  { title: "Réponses privées", text: "Vous seul voyez qui vient. Les réponses sont supprimées après l'événement." },
];

export default function HomePage() {
  const featured = TEMPLATES.slice(0, 6);
  const heroTemplate = getTemplate("recit-nuit") ?? TEMPLATES[0];
  const heroContent = sampleContent("mariage");
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero : l'invitation elle-même, sur un téléphone */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20 lg:pb-28">
          <div>
            <h1 className="max-w-[14ch] text-[3.4rem] leading-[0.98] text-balance sm:text-7xl lg:text-[5.5rem]">
              Une invitation qui s'ouvre sur le téléphone de chaque invité.
            </h1>
            <p className="text-muted-foreground mt-7 max-w-md text-lg leading-relaxed">
              Choisissez un design, ajoutez vos photos, le lieu et le programme. Vous recevez un lien et un QR code à partager, et vos invités répondent d'un geste.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/modeles">Voir les modèles</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#comment">Comment ça marche</Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-6 text-sm">
              Paiement unique dès {formatUsdCents(minPriceForTier("essentiel"))}, sans abonnement.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[320px]">
            <div className="relative">
              <div className="border-primary/40 absolute -top-4 -right-4 h-full w-full rounded-[2.4rem] border" aria-hidden />
              <div className="bg-background relative overflow-hidden rounded-[2.2rem] border-[7px] border-[#26231d] shadow-2xl">
                <div className="pointer-events-none h-[470px] overflow-hidden" aria-hidden>
                  <div className="w-[125%] origin-top-left scale-[0.8]">
                    <InvitationCover content={heroContent} template={heroTemplate} />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mt-7 text-center text-sm">
              Modèle{" "}
              <Link href={`/modeles/${heroTemplate.id}`} className="text-foreground underline-offset-4 hover:underline">
                {heroTemplate.name}
              </Link>
              , avec un texte d'exemple.
            </p>
          </div>
        </section>

        <Separator />

        {/* Événements : index */}
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:py-28">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-4xl sm:text-5xl">Pour quel événement ?</h2>
            <p className="text-muted-foreground mt-4 max-w-xs">
              Chaque type d'événement a ses textes d'exemple, ses designs et son tarif.
            </p>
          </div>
          <ul className="border-t">
            {CATEGORIES.map((c) => {
              const n = templatesForCategory(c.id).length;
              return (
                <li key={c.id} className="border-b">
                  <Link
                    href={`/modeles?categorie=${c.id}`}
                    className="group hover:bg-accent/40 focus-visible:bg-accent/40 flex items-center gap-4 px-1 py-5 outline-none transition-colors sm:px-3"
                  >
                    <span className="group-hover:text-primary font-serif text-3xl transition-colors sm:text-4xl">{c.label}</span>
                    <span className="text-muted-foreground ml-auto text-sm">
                      {n} {n > 1 ? "modèles" : "modèle"}
                    </span>
                    <ChevronRight className="text-muted-foreground group-hover:text-primary size-5 shrink-0 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <Separator />

        {/* Designs */}
        <section className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-4xl sm:text-5xl">Nos designs</h2>
            <Button asChild variant="outline">
              <Link href="/modeles">Voir tous les modèles</Link>
            </Button>
          </div>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </section>

        <Separator />

        {/* Étapes : une vraie séquence */}
        <section id="comment" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 lg:py-28">
          <h2 className="max-w-xl text-4xl sm:text-5xl">De l'idée au lien partagé, en quatre étapes.</h2>
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t pt-5">
                <span className="numeral text-primary font-serif text-6xl leading-none">{i + 1}</span>
                <h3 className="mt-5 font-serif text-2xl">{s.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <Separator />

        {/* Tarifs */}
        <section id="tarifs" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 lg:py-28">
          <div className="mb-12 max-w-xl">
            <h2 className="text-4xl sm:text-5xl">Un prix, payé une seule fois.</h2>
            <p className="text-muted-foreground mt-4">
              Le tarif dépend du type d'événement et de la formule. Vous payez en dollars ou en francs congolais.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => {
              const info = TIER_INFO[t];
              const highlighted = t === "standard";
              return (
                <Card key={t} className={highlighted ? "border-primary shadow-none" : "shadow-none"}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="font-serif text-3xl">{info.label}</CardTitle>
                      {highlighted && <Badge>Le plus choisi</Badge>}
                    </div>
                    <CardDescription>{info.blurb}</CardDescription>
                    <p className="pt-4">
                      <span className="text-muted-foreground mr-1.5 text-sm">dès</span>
                      <span className="numeral font-serif text-5xl">{formatUsdCents(minPriceForTier(t))}</span>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y text-sm">
                      {info.features.map((f) => (
                        <li key={f} className="py-2.5">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant={highlighted ? "default" : "outline"} className="w-full">
                      <Link href="/modeles">Choisir un modèle</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* Confiance */}
        <section className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
          <div className="grid gap-10 md:grid-cols-3">
            {TRUST.map((b) => (
              <div key={b.title}>
                <h3 className="font-serif text-2xl">{b.title}</h3>
                <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* FAQ */}
        <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:py-28">
          <h2 className="text-4xl sm:text-5xl">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="border-t">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
