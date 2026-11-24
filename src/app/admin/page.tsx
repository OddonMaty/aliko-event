import Link from "next/link";

import { fmtDateTime } from "@/lib/admin";
import { getCategory } from "@/lib/catalog";
import { q } from "@/lib/db";
import { formatMoney, formatUsdCents } from "@/lib/money";
import { isTestPayments } from "@/lib/testmode";
import { Bars, HBar, ORDER_STATUS, Panel, PageTitle, Stat, StatusBadge } from "./ui";

export default async function AdminHome() {
  const [k, daily, byCat, byTier, recent, alerts] = await Promise.all([
    q<Record<string, number>>`
      SELECT
        (SELECT COALESCE(sum(amount_usd_cents),0)::int FROM orders WHERE status='paid') AS revenue,
        (SELECT COALESCE(sum(amount_usd_cents),0)::int FROM orders WHERE status='paid' AND paid_at > now() - interval '30 days') AS revenue30,
        (SELECT COALESCE(sum(amount_usd_cents),0)::int FROM orders WHERE status='paid' AND paid_at > now() - interval '60 days' AND paid_at <= now() - interval '30 days') AS revenue_prev,
        (SELECT count(*)::int FROM orders WHERE status='paid') AS paid,
        (SELECT count(*)::int FROM orders WHERE status='pending' AND created_at < now() - interval '1 hour') AS stuck,
        (SELECT count(*)::int FROM orders WHERE created_at > now() - interval '30 days') AS orders30,
        (SELECT count(*)::int FROM orders WHERE status='paid' AND created_at > now() - interval '30 days') AS paid30,
        (SELECT count(*)::int FROM users) AS users,
        (SELECT count(*)::int FROM users WHERE created_at > now() - interval '7 days') AS users7,
        (SELECT count(*)::int FROM invitations WHERE status='published') AS live,
        (SELECT count(*)::int FROM invitations WHERE status='published' AND expires_at < now() + interval '3 days') AS expiring,
        (SELECT count(*)::int FROM rsvps) AS rsvps,
        (SELECT count(*)::int FROM guests) AS guests,
        (SELECT count(DISTINCT invitation_id)::int FROM abuse_reports WHERE status='open') AS reports`,
    q<{ d: string; v: number }>`
      SELECT to_char(g.d, 'DD/MM') AS d, COALESCE(sum(o.amount_usd_cents),0)::int AS v
      FROM generate_series((now() AT TIME ZONE 'Africa/Kinshasa')::date - 29, (now() AT TIME ZONE 'Africa/Kinshasa')::date, interval '1 day') AS g(d)
      LEFT JOIN orders o ON o.status='paid' AND (o.paid_at AT TIME ZONE 'Africa/Kinshasa')::date = g.d::date
      GROUP BY g.d ORDER BY g.d`,
    q<{ category: string; n: number; v: number }>`
      SELECT category, count(*)::int AS n, sum(amount_usd_cents)::int AS v FROM orders WHERE status='paid' GROUP BY category ORDER BY v DESC`,
    q<{ tier: string; n: number }>`SELECT tier, count(*)::int AS n FROM orders WHERE status='paid' GROUP BY tier ORDER BY n DESC`,
    q<{ id: string; reference: string; status: string; amount: number; currency: "USD" | "CDF"; created_at: string; email: string; category: string }>`
      SELECT o.id, o.reference, o.status, o.amount, o.currency, o.created_at, u.email, o.category
      FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 6`,
    q<{ id: number; action: string; entity_id: string | null; created_at: string }>`
      SELECT id, action, entity_id, created_at FROM audit_log
      WHERE action LIKE 'order.%mismatch' OR action IN ('callback.unknown_order','order.provider_error') OR action LIKE 'error.%'
      ORDER BY id DESC LIMIT 5`,
  ]);
  const s = k[0]!;
  const growth = s.revenue_prev ? Math.round(((s.revenue30! - s.revenue_prev) / s.revenue_prev) * 100) : null;
  const conv = s.orders30 ? Math.round((s.paid30! / s.orders30) * 100) : null;
  const needs = (s.reports ?? 0) + (s.stuck ?? 0) + alerts.length;

  return (
    <>
      <PageTitle title="Vue d'ensemble" hint="L'état du service en un coup d'œil.">
        {isTestPayments() && <span className="bg-accent rounded-full border px-3 py-1 text-xs">Paiements en mode test</span>}
      </PageTitle>

      {needs > 0 && (
        <div className="border-destructive/40 bg-destructive/5 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-4 py-3 text-sm">
          <strong>À traiter</strong>
          {s.reports! > 0 && <Link href="/admin/moderation" className="underline-offset-4 hover:underline">{s.reports} invitation(s) signalée(s)</Link>}
          {s.stuck! > 0 && <Link href="/admin/commandes?status=pending" className="underline-offset-4 hover:underline">{s.stuck} commande(s) en attente depuis plus d&apos;une heure</Link>}
          {alerts.length > 0 && <Link href="/admin/journal" className="underline-offset-4 hover:underline">{alerts.length} alerte(s) dans le journal</Link>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Chiffre d'affaires (30 j)" value={formatUsdCents(s.revenue30!)} sub={growth === null ? "Pas encore de comparaison" : `${growth >= 0 ? "+" : ""}${growth} % vs 30 j précédents`} tone={growth !== null && growth >= 0 ? "good" : undefined} />
        <Stat label="Chiffre d'affaires total" value={formatUsdCents(s.revenue!)} sub={`${s.paid} commande(s) payée(s)`} />
        <Stat label="Conversion (30 j)" value={conv === null ? "—" : `${conv} %`} sub={`${s.paid30} payée(s) sur ${s.orders30}`} />
        <Stat label="Utilisateurs" value={s.users} sub={`+${s.users7} cette semaine`} />
        <Stat label="Invitations en ligne" value={s.live} sub={s.expiring ? `${s.expiring} expirent sous 3 jours` : "Aucune expiration proche"} />
        <Stat label="Invités enregistrés" value={s.guests} />
        <Stat label="Réponses reçues" value={s.rsvps} />
        <Stat label="Signalements ouverts" value={s.reports} tone={s.reports! > 0 ? "warn" : undefined} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Ventes des 30 derniers jours" hint="En dollars, par jour (heure de Kinshasa).">
            <Bars data={daily.map((d) => ({ label: d.d, value: d.v }))} format={formatUsdCents} label="Ventes par jour" />
          </Panel>
        </div>
        <Panel title="Par formule" hint="Commandes payées.">
          <HBar rows={byTier.map((t) => ({ label: t.tier.charAt(0).toUpperCase() + t.tier.slice(1), value: t.n }))} format={(n) => `${n}`} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Ventes par catégorie" hint="Chiffre d'affaires, commandes payées.">
          <HBar rows={byCat.map((c) => ({ label: `${getCategory(c.category)?.label ?? c.category} (${c.n})`, value: c.v }))} format={formatUsdCents} />
        </Panel>
        <Panel title="Dernières commandes" action={<Link href="/admin/commandes" className="text-primary text-xs underline-offset-4 hover:underline">Tout voir</Link>}>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune commande.</p>
          ) : (
            <ul className="divide-y text-sm">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate">{o.email}</p>
                    <p className="text-muted-foreground text-xs">{getCategory(o.category)?.label ?? o.category} · {fmtDateTime(o.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums">{formatMoney(o.amount, o.currency)}</span>
                    <StatusBadge map={ORDER_STATUS} value={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
