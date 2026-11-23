"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { BASE_GUESTS, GUEST_LIMITS, guestExtraCents, TIERS, TIER_INFO, type Category, type GuestLimit, type Tier } from "@/lib/catalog";
import { formatUsdCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export function PurchasePanel({
  templateId,
  categories,
  initialCategory,
}: {
  templateId: string;
  categories: Pick<Category, "id" | "label" | "prices" | "extraGuestCents">[];
  initialCategory: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [tier, setTier] = useState<Tier>("standard");
  const [guests, setGuests] = useState<GuestLimit>(BASE_GUESTS);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelInView, setPanelInView] = useState(true);
  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setPanelInView(entry.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const current = categories.find((c) => c.id === category) ?? categories[0];
  const extra = guestExtraCents(current.extraGuestCents, guests);
  const priceOf = (t: Tier) => current.prices[t] + extra;
  const price = priceOf(tier);

  const cheapest = Math.min(...TIERS.map(priceOf));

  return (
    <>
    <div ref={panelRef} className="scroll-mt-20">
    <Card>
      <CardHeader>
        <CardTitle>Choisissez votre formule</CardTitle>
        <CardDescription>Paiement unique, sans abonnement.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {categories.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="cat">Type d'événement</Label>
            <NativeSelect id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="guests">Nombre d&apos;invités</Label>
          <NativeSelect id="guests" value={guests} onChange={(e) => setGuests(Number(e.target.value) as GuestLimit)}>
            {GUEST_LIMITS.map((n) => (
              <option key={n} value={n}>
                Jusqu&apos;à {n} invités
              </option>
            ))}
          </NativeSelect>
          <p className="text-muted-foreground text-xs">
            {extra > 0
              ? `Inclut ${formatUsdCents(extra)} pour les invités au-delà de ${BASE_GUESTS}.`
              : `${BASE_GUESTS} invités inclus. Au-delà : ${formatUsdCents(current.extraGuestCents)} par invité en plus.`}
          </p>
        </div>

        <div className="space-y-2" role="radiogroup" aria-label="Formule">
          {TIERS.map((t) => {
            const info = TIER_INFO[t];
            const active = t === tier;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTier(t)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-colors",
                  active ? "border-primary bg-accent/40 ring-primary/40 ring-1" : "hover:bg-accent/20",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    {info.label}
                    {t === "standard" && <Badge variant="secondary">Populaire</Badge>}
                  </span>
                  <span className="text-primary font-serif text-lg font-semibold">{formatUsdCents(priceOf(t))}</span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{info.blurb}</p>
                {active && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {info.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                        {f}
                      </li>
                    ))}
                    {info.soon.map((f) => (
                      <li key={f} className="text-muted-foreground flex items-start gap-2">
                        <span className="mt-0.5 size-4 shrink-0 text-center text-xs">·</span>
                        {f} <Badge variant="outline">bientôt</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            );
          })}
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href={`/acheter?modele=${templateId}&categorie=${current.id}&palier=${tier}&invites=${guests}`}>
            Acheter ce design · {formatUsdCents(price)}
          </Link>
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Mobile Money (M-Pesa, Airtel Money, Orange Money) ou carte bancaire. Vous personnalisez après l'achat.
        </p>
      </CardContent>
    </Card>
    </div>

    {/* Barre d'achat fixe (téléphone) : mène au choix de la formule */}
    <div
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t px-4 pt-3 backdrop-blur transition-transform duration-300 lg:hidden"
      style={{
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        transform: panelInView ? "translateY(100%)" : "translateY(0)",
      }}
      aria-hidden={panelInView}
    >
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">À partir de</p>
        <p className="text-primary font-serif text-xl leading-none font-semibold">{formatUsdCents(cheapest)}</p>
      </div>
      <Button
        type="button"
        size="lg"
        tabIndex={panelInView ? -1 : 0}
        onClick={() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      >
        Choisir ma formule
      </Button>
    </div>
    </>
  );
}
