import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { requireAdmin } from "@/lib/admin";
import { q } from "@/lib/db";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const r = await q<{ n: number }>`SELECT count(DISTINCT invitation_id)::int AS n FROM abuse_reports WHERE status = 'open'`.catch(() => []);
  const f = await q<{ n: number }>`SELECT count(*)::int AS n FROM orders WHERE status = 'paid' AND invitation_deleted_at IS NOT NULL AND payment_method <> 'test'`.catch(() => []);
  return (
    <>
      <SiteHeader />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] lg:py-10">
        <aside><AdminNav openReports={r[0]?.n ?? 0} toRefund={f[0]?.n ?? 0} /></aside>
        <main className="min-w-0">{children}</main>
      </div>
    </>
  );
}
