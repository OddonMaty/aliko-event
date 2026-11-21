import Link from "next/link";
import { Check, LayoutTemplate, Link2, QrCode, ShieldCheck, Smartphone, Wallet } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TemplateCard } from "@/components/template-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES, minPriceForTier, TIERS, TIER_INFO } from "@/lib/catalog";
import { formatUsdCents } from "@/lib/money";
import { TEMPLATES } from "@/lib/templates";

const STEPS = [
  { icon: LayoutTemplate, title: "Choisissez", text: "Votre type d'événement, puis le design qui vous plaît." },
  { icon: Wallet, title: "Achetez", text: "Un paiement unique par Mobile Money ou carte. Pas d'abonnement." },
  { icon: Smartphone, title: "Personnalisez", text: "Ajoutez vos textes, vos photos, le lieu et le programme." },
  { icon: Link2, title: "Partagez", text: "Recevez votre lien et votre QR code, envoyez-les à vos invités." },
];

const FAQ = [
  { q: "Faut-il un abonnement ?", a: "Non. Vous payez une seule fois, par invitation, selon l'événement et la formule choisie." },
  { q: "Comment payer ?", a: "Par Mobile Money (M-Pesa, Airtel Money ou Orange Money) ou par carte bancaire, en dollars ou en francs congolais." },
  { q: "Mes invités doivent-ils créer un compte ?", a: "Non. Ils ouvrent le lien, voient l'invitation et confirment leur présence en quelques secondes." },
  { q: "Puis-je modifier mon invitation après l'avoir publiée ?", a: "Oui. Vos modifications apparaissent immédiatement sur le même lien, sans le renvoyer." },
  { q: "Mon invitation est-elle protégée ?", a: "Votre lien est unique et impossible à deviner, non référencé par les moteurs de recherche, et les réponses de vos invités ne sont visibles que par vous." },
  { q: "Combien de temps reste-t-elle en ligne ?", a: "Jusqu'à 30 jours après la date de votre événement." },
];

export default function HomePage() {
  const featured = TEMPLATES.slice(0, 6);
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center">
          <p className="text-primary mb-5 text-xs font-medium tracking-[0.3em] uppercase">Invitations numériques</p>
          <h1 className="text-4xl leading-[1.1] font-semibold text-balance sm:text-6xl">
            Des invitations élégantes, prêtes en quelques minutes.
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-balance">
            Choisissez un design, personnalisez-le, recevez votre lien et votre QR code. Mariage, anniversaire, baby shower, conférence…
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/modeles">Voir les modèles</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#comment">Comment ça marche</Link>
            </Button>
          </div>
          <div className="gold-rule mx-auto mt-16 max-w-md" />
        </section>

        {/* Catégories */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-8 text-center text-2xl font-semibold sm:text-3xl">Pour chaque événement</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={`/modeles?categorie=${c.id}`}
                className="bg-card hover:border-primary/60 group flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-colors"
              >
                <CategoryIcon name={c.icon} className="text-primary size-6" />
                <span className="text-sm font-medium">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Modèles */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-semibold sm:text-3xl">Nos designs</h2>
            <Button asChild variant="link">
              <Link href="/modeles">Tout voir →</Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </section>

        {/* Étapes */}
        <section id="comment" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold sm:text-3xl">Simple comme 1, 2, 3, 4</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="space-y-3 text-center">
                <div className="bg-accent text-primary mx-auto flex size-12 items-center justify-center rounded-full">
                  <s.icon className="size-5" />
                </div>
                <p className="text-muted-foreground text-xs tracking-widest">ÉTAPE {i + 1}</p>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tarifs */}
        <section id="tarifs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <h2 className="mb-3 text-center text-2xl font-semibold sm:text-3xl">Des tarifs clairs, sans abonnement</h2>
          <p className="text-muted-foreground mx-auto mb-10 max-w-xl text-center">
            Le prix dépend de l'événement et de la formule. Paiement unique en USD ou en CDF.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => {
              const info = TIER_INFO[t];
              return (
                <Card key={t} className={t === "standard" ? "border-primary/60 shadow-md" : ""}>
                  <CardHeader>
                    <CardTitle className="text-xl">{info.label}</CardTitle>
                    <CardDescription>{info.blurb}</CardDescription>
                    <p className="text-primary pt-3 font-serif text-3xl font-semibold">
                      <span className="text-muted-foreground mr-1 text-sm font-sans font-normal">dès</span>
                      {formatUsdCents(minPriceForTier(t))}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5 text-sm">
                      {info.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="text-primary mt-0.5 size-4 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Confiance */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Paiement sécurisé", text: "Mobile Money et carte via FlexPay. Votre invitation est activée uniquement après confirmation du paiement." },
              { icon: QrCode, title: "Lien et QR uniques", text: "Un lien impossible à deviner et un QR code généré automatiquement, à imprimer ou à partager." },
              { icon: Link2, title: "Vos invités, vos données", text: "Seul vous voyez les réponses. Elles sont supprimées après l'événement." },
            ].map((b) => (
              <div key={b.title} className="flex gap-4">
                <b.icon className="text-primary mt-1 size-6 shrink-0" />
                <div>
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold sm:text-3xl">Questions fréquentes</h2>
          <div className="divide-y rounded-xl border">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {f.q}
                  <span className="text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="text-muted-foreground mt-3 text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
