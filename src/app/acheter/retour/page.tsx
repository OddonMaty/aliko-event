import type { Metadata } from "next";

import { OrderStatus } from "@/components/order-status";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Confirmation du paiement", robots: { index: false } };

export default async function ReturnPage({ searchParams }: { searchParams: Promise<{ order?: string; r?: string }> }) {
  const { order, r } = await searchParams;
  await requireUser(`/acheter/retour?order=${order ?? ""}`);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-20">
        <OrderStatus orderId={order ?? ""} cancelled={r === "cancel" || r === "decline"} />
      </main>
    </>
  );
}
