import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { TestPayment } from "@/components/test-payment";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import type { Currency } from "@/lib/money";
import { isTestPayments } from "@/lib/testmode";

export const metadata: Metadata = { title: "Paiement simulé", robots: { index: false } };

export default async function SimulationPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  if (!isTestPayments()) notFound();
  const { order } = await searchParams;
  const user = await requireUser(`/acheter/simulation?order=${order ?? ""}`);
  if (!order || !/^[0-9a-f-]{36}$/i.test(order)) notFound();

  const rows = await q<{ id: string; amount: number; currency: Currency; reference: string; status: string }>`
    SELECT id, amount, currency, reference, status FROM orders
    WHERE id = ${order} AND user_id = ${user.id} AND payment_method = 'test'`;
  const o = rows[0];
  if (!o) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-16">
        <TestPayment orderId={o.id} amount={o.amount} currency={o.currency} reference={o.reference} />
      </main>
    </>
  );
}
