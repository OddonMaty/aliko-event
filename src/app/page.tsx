import Link from "next/link";
import { Check, Link2, Lock, ShieldCheck } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { InvitationCover } from "@/components/invitation/invitation-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TemplateCard } from "@/components/template-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BASE_GUESTS, CATEGORIES, getCategory, minPriceForTier, priceUsdCents, TIERS, TIER_INFO } from "@/lib/catalog";
import { sampleContent } from "@/lib/content";
import { loadCatalog } from "@/lib/settings";
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
  { q: "Combien de temps reste-t-elle en ligne ?", a: "Jusqu'à la fin du jour de votre événement (minuit, heure de Kinshasa). Elle est ensuite supprimée automatiquement : pensez à télécharger la liste de vos invités avant." },
];

const TRUST_ICONS = [ShieldCheck, Link2, Lock];

const TRUST = [
  { title: "Paiement vérifié", text: "Votre invitation n'est activée qu'une fois le paiement confirmé par FlexPay." },
  { title: "Lien impossible à deviner", text: "Personne ne peut tomber sur votre invitation par hasard, ni la retrouver sur Google." },
  { title: "Réponses privées", text: "Vous seul voyez qui vient. Les réponses sont supprimées après l'événement." },
];

export default async function HomePage() {
  await loadCatalog();
  const featured = TEMPLATES.slice(0, 6);
  const heroTemplate = getTemplate("recit-nuit") ?? TEMPLATES[0];
  const heroContent = sampleContent("mariage");
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero : l'invitation elle-même, sur un téléphone */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-8 pb-14 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20 lg:pb-28">
          <div>
            <h1 className="max-w-[14ch] text-[2.8rem] leading-[1] text-balance sm:text-7xl lg:text-[5.5rem]">
              Une invitation qui s'ouvre sur le téléphone de chaque invité.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-md text-base sm:text-lg leading-relaxed">
              Choisissez un design, ajoutez vos photos, le lieu et le programme. Vous recevez un lien et un QR code à partager, et vos invités répondent d'un geste.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/modeles">Voir les modèles</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="#comment">Comment ça marche</Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-6 text-sm">
              Paiement unique dès {formatUsdCents(minPriceForTier("essentiel"))} pour {BASE_GUESTS} invités, sans abonnement.
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

        {/* Événements : petites cartes avec le nombre de modèles */}
        <section className="mx-auto max-w-6xl px-5 py-10 lg:py-28">
          <div className="mb-8 lg:mb-12 max-w-xl">
            <h2 className="text-3xl sm:text-5xl">Pour quel événement ?</h2>
            <p className="text-muted-foreground mt-4">Chaque type d&apos;événement a ses textes d&apos;exemple, ses designs et son tarif.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => {
              const n = templatesForCategory(c.id).length;
              return (
                <Link
                  key={c.id}
                  href={`/modeles?categorie=${c.id}`}
                  className="bg-card hover:border-primary/60 focus-visible:border-primary group flex flex-col items-center gap-3 rounded-xl border p-4 text-center sm:p-6 outline-none transition-colors"
                >
                  <CategoryIcon name={c.icon} className="text-primary size-7" />
                  <span className="font-medium">{c.label}</span>
                  <span className="text-muted-foreground text-sm">
                    {n} {n > 1 ? "modèles" : "modèle"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* Designs */}
        <section className="mx-auto max-w-6xl px-5 py-10 lg:py-28">
          <div className="mb-8 lg:mb-12 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl sm:text-5xl">Nos designs</h2>
            <Button asChild variant="outline">
              <Link href="/modeles">Voir tous les modèles</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3 lg:gap-y-14">
            {featured.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </section>

        <Separator className="hidden md:block" />

        {/* Étapes : une vraie séquence */}
        <section id="comment" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-7 lg:py-28">
          <h2 className="max-w-xl text-xl md:text-5xl">De l'idée au lien partagé, en quatre étapes.</h2>
          <ol className="bg-card mt-4 divide-y rounded-2xl border md:hidden">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3 px-4 py-3">
                <span className="bg-primary/15 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">{i + 1}</span>
                <div className="min-w-0">
                  <h3 className="font-sans text-[15px] leading-tight font-medium">{s.title}</h3>
                  <p className="text-muted-foreground mt-0.5 text-[13px] leading-snug">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <ol className="mt-14 hidden gap-10 md:grid md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t pt-5">
                <span className="numeral text-primary font-serif text-5xl leading-none lg:text-6xl">{i + 1}</span>
                <h3 className="mt-3 font-serif text-2xl">{s.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <Separator className="hidden md:block" />

        {/* Tarifs */}
        <section id="tarifs" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-7 lg:py-28">
          <div className="mb-4 max-w-xl lg:mb-12">
            <h2 className="text-xl md:text-5xl">Un prix, payé une seule fois.</h2>
            <p className="text-muted-foreground mt-1.5 text-[13px] leading-snug md:mt-4 md:text-base">
              Le tarif dépend du type d'événement, de la formule et du nombre d'invités. Vous payez en dollars ou en francs congolais.
            </p>
          </div>
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 md:hidden">
            {TIERS.map((t) => {
              const info = TIER_INFO[t];
              const highlighted = t === "standard";
              return (
                <div key={t} className={`bg-card flex w-[72%] shrink-0 snap-start flex-col rounded-2xl border p-4 ${highlighted ? "border-primary" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-serif text-xl leading-none font-semibold">{info.label}</p>
                    {highlighted && <Badge className="px-1.5 py-0 text-[10px]">Le plus choisi</Badge>}
                  </div>
                  <p className="mt-2">
                    <span className="text-muted-foreground text-xs">dès </span>
                    <span className="numeral font-serif text-3xl leading-none">{formatUsdCents(minPriceForTier(t))}</span>
                  </p>
                  <p className="text-muted-foreground text-[11px]">pour {BASE_GUESTS} invités</p>
                  <ul className="mt-3 space-y-1.5 text-[13px] leading-snug">
                    {info.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="text-primary mt-0.5 size-3.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="sm" variant={highlighted ? "default" : "outline"} className="mt-auto w-full">
                    <Link href="/modeles">Choisir un modèle</Link>
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="hidden gap-6 md:grid md:grid-cols-3">
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
                      <span className="numeral font-serif text-4xl sm:text-5xl">{formatUsdCents(minPriceForTier(t))}</span>
                      <span className="text-muted-foreground ml-1.5 text-sm">pour {BASE_GUESTS} invités</span>
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

          <div className="mt-6 lg:mt-16">
            <h3 className="font-serif text-lg md:text-3xl">Prix par événement</h3>
            <p className="text-muted-foreground mt-1 mb-3 max-w-xl text-[13px] leading-snug md:mt-2 md:mb-6 md:text-sm">
              Prix pour {BASE_GUESTS} invités. Chaque invité en plus s&apos;ajoute au prix, au tarif indiqué dans la dernière colonne.
            </p>
            <ul className="divide-y rounded-xl border md:hidden">
              {CATEGORIES.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-muted-foreground text-[10px]">+ {formatUsdCents(c.extraGuestCents)} / invité en plus</p>
                  </div>
                  <dl className="grid shrink-0 grid-cols-3 gap-3 text-right text-[13px]">
                    {TIERS.map((t) => (
                      <div key={t}>
                        <dt className="text-muted-foreground text-[10px]">{TIER_INFO[t].label}</dt>
                        <dd className="numeral">{formatUsdCents(c.prices[t])}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
            <div className="hidden rounded-xl border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Événement</TableHead>
                    {TIERS.map((t) => (
                      <TableHead key={t} className="text-right">
                        {TIER_INFO[t].label}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Par invité en plus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CATEGORIES.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.label}</TableCell>
                      {TIERS.map((t) => (
                        <TableCell key={t} className="numeral text-right">
                          {formatUsdCents(c.prices[t])}
                        </TableCell>
                      ))}
                      <TableCell className="numeral text-muted-foreground text-right">{formatUsdCents(c.extraGuestCents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-muted-foreground mt-3 text-xs md:mt-4 md:text-sm">
              Exemple : un mariage de 200 invités en formule Standard coûte {formatUsdCents(priceUsdCents("mariage", "standard", 200))}
              {" "}({formatUsdCents(getCategory("mariage")!.prices.standard)} + 150 invités en plus).
            </p>
          </div>
        </section>

        <Separator className="hidden md:block" />

        {/* Confiance */}
        <section className="mx-auto max-w-6xl px-5 py-6 lg:py-24">
          <ul className="bg-card divide-y rounded-2xl border md:hidden">
            {TRUST.map((b, i) => {
              const Icon = TRUST_ICONS[i];
              return (
                <li key={b.title} className="flex items-start gap-3 px-4 py-3">
                  <span className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-sans text-[15px] leading-tight font-medium">{b.title}</h3>
                    <p className="text-muted-foreground mt-0.5 text-[13px] leading-snug">{b.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="hidden gap-8 md:grid md:grid-cols-3">
            {TRUST.map((b) => (
              <div key={b.title}>
                <h3 className="font-serif text-2xl">{b.title}</h3>
                <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="hidden md:block" />

        {/* FAQ */}
        <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-20 gap-3 px-5 py-7 lg:grid-cols-[1fr_2fr] lg:gap-10 lg:py-28">
          <h2 className="text-xl md:text-5xl">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="bg-card rounded-2xl border px-4 md:border-0 md:border-t md:bg-transparent md:px-0">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="py-3 text-sm md:py-5 md:text-base">{f.q}</AccordionTrigger>
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
