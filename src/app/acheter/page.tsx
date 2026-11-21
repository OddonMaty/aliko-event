import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutForm } from "@/components/checkout-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { getCategory, isTier, priceUsdCents, TIER_INFO } from "@/lib/catalog";
import { toMinorAmount } from "@/lib/money";
import { getTemplate } from "@/lib/templates";

export const metadata: Metadata = { title: "Paiement", robots: { index: false } };

type Props = { searchParams: Promise<{ modele?: string; categorie?: string; palier?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const sp = await searchParams;
  const template = sp.modele ? getTemplate(sp.modele) : undefined;
  const category = sp.categorie ? getCategory(sp.categorie) : undefined;
  if (!template || !category || !isTier(sp.palier) || !template.categories.includes(category.id)) notFound();

  const tier = sp.palier;
  const here = `/acheter?modele=${template.id}&categorie=${category.id}&palier=${tier}`;
  const user = await requireUser(here);

  const usdCents = priceUsdCents(category.id, tier);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-semibold">Finaliser votre achat</h1>
        <CheckoutForm
          templateId={template.id}
          templateName={template.name}
          category={category.id}
          categoryLabel={category.label}
          tier={tier}
          tierLabel={TIER_INFO[tier].label}
          usd={toMinorAmount(usdCents, "USD")}
          cdf={toMinorAmount(usdCents, "CDF")}
          userName={user.name}
        />
      </main>
      <SiteFooter />
    </>
  );
}
