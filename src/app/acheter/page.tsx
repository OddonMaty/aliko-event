import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutForm } from "@/components/checkout-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { getCategory, isGuestLimit, isTier, priceUsdCents, TIER_INFO } from "@/lib/catalog";
import { toMinorAmount } from "@/lib/money";
import { getTemplate } from "@/lib/templates";
import { isTestPayments } from "@/lib/testmode";

export const metadata: Metadata = { title: "Paiement", robots: { index: false } };

type Props = { searchParams: Promise<{ modele?: string; categorie?: string; palier?: string; invites?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const sp = await searchParams;
  const template = sp.modele ? getTemplate(sp.modele) : undefined;
  const category = sp.categorie ? getCategory(sp.categorie) : undefined;
  if (!template || !category || !isTier(sp.palier) || !template.categories.includes(category.id)) notFound();

  const tier = sp.palier;
  const guestsParam = Number(sp.invites ?? 50);
  const guests = isGuestLimit(guestsParam) ? guestsParam : 50;
  const here = `/acheter?modele=${template.id}&categorie=${category.id}&palier=${tier}&invites=${guests}`;
  const user = await requireUser(here);

  const usdCents = priceUsdCents(category.id, tier, guests);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 md:py-12">
        <h1 className="mb-6 text-3xl font-semibold md:mb-8">Finaliser votre achat</h1>
        <CheckoutForm
          templateId={template.id}
          templateName={template.name}
          category={category.id}
          categoryLabel={category.label}
          tier={tier}
          tierLabel={TIER_INFO[tier].label}
          guests={guests}
          usd={toMinorAmount(usdCents, "USD")}
          cdf={toMinorAmount(usdCents, "CDF")}
          userName={user.name}
          testMode={isTestPayments()}
        />
      </main>
      <SiteFooter />
    </>
  );
}
