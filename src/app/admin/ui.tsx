import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PAGE_SIZE } from "@/lib/admin";
import { cn } from "@/lib/utils";

export function PageTitle({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-3xl leading-tight">{title}</h1>
        {hint && <p className="text-muted-foreground mt-1 text-sm">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: "warn" | "good" }) {
  return (
    <Card className="gap-1 p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums", tone === "warn" && "text-destructive")}>{value}</p>
      {sub && <p className={cn("text-xs", tone === "good" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>{sub}</p>}
    </Card>
  );
}

export function Panel({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

export const ORDER_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" }> = {
  pending: { label: "En attente", variant: "outline" },
  paid: { label: "Payée", variant: "success" },
  failed: { label: "Échouée", variant: "destructive" },
  cancelled: { label: "Annulée", variant: "secondary" },
  refunded: { label: "Remboursée", variant: "secondary" },
};

export const INV_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" }> = {
  awaiting_payment: { label: "Paiement en attente", variant: "outline" },
  draft: { label: "Brouillon", variant: "secondary" },
  published: { label: "Publiée", variant: "success" },
  suspended: { label: "Suspendue", variant: "destructive" },
  archived: { label: "Archivée", variant: "outline" },
};

export function StatusBadge({ map, value }: { map: typeof ORDER_STATUS; value: string }) {
  const s = map[value] ?? { label: value, variant: "outline" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

/** Barre de recherche + filtre, en GET : l'URL reste partageable et la page sans JavaScript. */
export function Filters({
  q, status, options, placeholder,
}: { q?: string; status?: string; options?: { value: string; label: string }[]; placeholder: string }) {
  return (
    <form className="mb-4 flex flex-wrap gap-2" role="search">
      <div className="relative min-w-52 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input name="q" defaultValue={q} placeholder={placeholder} className="pl-9" aria-label={placeholder} />
      </div>
      {options && (
        <select name="status" defaultValue={status ?? ""} aria-label="Filtrer par statut" className="border-input bg-background h-10 rounded-md border px-3 text-base md:text-sm">
          <option value="">Tous les statuts</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
      <button className="bg-primary text-primary-foreground h-10 rounded-md px-4 text-sm font-medium">Filtrer</button>
    </form>
  );
}

export function Pager({ base, params, page, total }: { base: string; params: Record<string, string | undefined>; page: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `${base}?${s}` : base;
  };
  return (
    <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
      <span>{total} résultat{total > 1 ? "s" : ""}</span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-md border" aria-label="Page précédente"><ChevronLeft className="size-4" /></Link>
          ) : <span className="inline-flex size-9 items-center justify-center rounded-md border opacity-40"><ChevronLeft className="size-4" /></span>}
          <span className="px-2 tabular-nums">{page} / {pages}</span>
          {page < pages ? (
            <Link href={href(page + 1)} className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-md border" aria-label="Page suivante"><ChevronRight className="size-4" /></Link>
          ) : <span className="inline-flex size-9 items-center justify-center rounded-md border opacity-40"><ChevronRight className="size-4" /></span>}
        </div>
      )}
    </div>
  );
}

/** Histogramme SVG sans bibliothèque : accessible (titre + valeurs en texte) et sobre. */
export function Bars({ data, format, label }: { data: { label: string; value: number }[]; format: (n: number) => string; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 600, H = 140, gap = 3;
  const bw = (W - gap * (data.length - 1)) / data.length;
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={`${label} : total ${format(total)}`}>
        <title>{label}</title>
        {data.map((d, i) => {
          const h = d.value === 0 ? 2 : Math.max(4, (d.value / max) * H);
          return (
            <rect key={d.label} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={2} className={d.value ? "fill-primary" : "fill-muted"}>
              <title>{`${d.label} : ${format(d.value)}`}</title>
            </rect>
          );
        })}
        <text x={0} y={H + 14} className="fill-muted-foreground text-[10px]">{data[0]?.label}</text>
        <text x={W} y={H + 14} textAnchor="end" className="fill-muted-foreground text-[10px]">{data[data.length - 1]?.label}</text>
      </svg>
    </figure>
  );
}

export function HBar({ rows, format }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-muted-foreground text-sm">Aucune donnée pour l&apos;instant.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="mb-1 flex justify-between gap-2"><span className="truncate">{r.label}</span><span className="text-muted-foreground tabular-nums">{format(r.value)}</span></div>
          <div className="bg-muted h-1.5 rounded-full"><div className="bg-primary h-full rounded-full" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
