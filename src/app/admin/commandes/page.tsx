import { Check, RefreshCw, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fmtDateTime, likeOf, PAGE_SIZE, pageOf } from "@/lib/admin";
import { getCategory } from "@/lib/catalog";
import { q } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { updateOrder } from "../actions";
import { ConfirmButton } from "../confirm-button";
import { Filters, ORDER_STATUS, PageTitle, Pager, StatusBadge } from "../ui";

type SP = { q?: string; status?: string; page?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const like = likeOf(sp.q);
  const status = Object.prototype.hasOwnProperty.call(ORDER_STATUS, sp.status ?? "") ? sp.status! : "";
  const page = pageOf(sp.page);

  const [rows, count] = await Promise.all([
    q<{
      id: string; reference: string; status: string; amount: number; currency: "USD" | "CDF"; amount_usd_cents: number;
      payment_method: string; category: string; tier: string; guest_limit: number; created_at: string; paid_at: string | null;
      flexpay_order_number: string | null; email: string; name: string;
    }>`
      SELECT o.id, o.reference, o.status, o.amount, o.currency, o.amount_usd_cents, o.payment_method, o.category, o.tier, o.guest_limit,
             o.created_at, o.paid_at, o.flexpay_order_number, u.email, u.name
      FROM orders o JOIN users u ON u.id = o.user_id
      WHERE (${status} = '' OR o.status = ${status})
        AND (${like} = '' OR o.reference ILIKE ${like} OR u.email ILIKE ${like} OR u.name ILIKE ${like})
      ORDER BY o.created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    q<{ n: number }>`
      SELECT count(*)::int AS n FROM orders o JOIN users u ON u.id = o.user_id
      WHERE (${status} = '' OR o.status = ${status})
        AND (${like} = '' OR o.reference ILIKE ${like} OR u.email ILIKE ${like} OR u.name ILIKE ${like})`,
  ]);

  return (
    <>
      <PageTitle title="Commandes" hint="Paiements, vérification auprès de FlexPay et remboursements." />
      <Filters q={sp.q} status={status} placeholder="Référence, e-mail ou nom" options={Object.entries(ORDER_STATUS).map(([value, v]) => ({ value, label: v.label }))} />

      {rows.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">Aucune commande ne correspond.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((o) => (
            <li key={o.id} className="bg-card rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{o.name} <span className="text-muted-foreground font-normal">· {o.email}</span></p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {getCategory(o.category)?.label ?? o.category} · {o.tier} · {o.guest_limit} invités · {o.payment_method === "test" ? "test" : o.payment_method === "card" ? "carte" : "Mobile Money"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    <span className="font-mono">{o.reference}</span> · créée {fmtDateTime(o.created_at)}{o.paid_at ? ` · payée ${fmtDateTime(o.paid_at)}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-lg font-semibold tabular-nums">{formatMoney(o.amount, o.currency)}</span>
                  <StatusBadge map={ORDER_STATUS} value={o.status} />
                </div>
              </div>
              {(o.status === "pending" || o.status === "failed" || o.status === "paid") && (
                <form action={updateOrder} className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                  <input type="hidden" name="orderId" value={o.id} />
                  {o.status !== "paid" && o.flexpay_order_number && (
                    <Button type="submit" name="action" value="check" variant="outline" size="sm"><RefreshCw className="size-4" />Vérifier avec FlexPay</Button>
                  )}
                  {o.status === "paid" && o.payment_method !== "test" && (
                    <ConfirmButton message="Marquer cette commande comme remboursée ? L'invitation sera suspendue. Le remboursement lui-même se fait chez FlexPay." name="action" value="refund" variant="outline" size="sm"><Undo2 className="size-4" />Marquer remboursée</ConfirmButton>
                  )}
                  {o.status === "paid" && <span className="text-muted-foreground inline-flex items-center gap-1 text-xs"><Check className="size-3.5" />Confirmée par FlexPay</span>}
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      <Pager base="/admin/commandes" params={{ q: sp.q, status }} page={page} total={count[0]?.n ?? 0} />
    </>
  );
}
