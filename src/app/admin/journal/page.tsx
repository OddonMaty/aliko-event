import { fmtDateTime, PAGE_SIZE, pageOf } from "@/lib/admin";
import { q } from "@/lib/db";
import { PageTitle, Pager } from "../ui";

type SP = { type?: string; page?: string };

const TYPES: Record<string, { label: string; like: string }> = {
  "": { label: "Tout", like: "%" },
  alertes: { label: "Alertes", like: "%mismatch" },
  erreurs: { label: "Erreurs", like: "error.%" },
  admin: { label: "Actions admin", like: "admin.%" },
  paiements: { label: "Paiements", like: "order.%" },
  comptes: { label: "Comptes", like: "user.%" },
};

export default async function JournalPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const type = sp.type && Object.prototype.hasOwnProperty.call(TYPES, sp.type) ? sp.type : "";
  const like = TYPES[type]!.like;
  const page = pageOf(sp.page);

  const [rows, count] = await Promise.all([
    q<{ id: number; actor: string | null; action: string; entity: string | null; entity_id: string | null; meta: unknown; created_at: string }>`
      SELECT id, actor, action, entity, entity_id, meta, created_at FROM audit_log
      WHERE action LIKE ${like} ORDER BY id DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    q<{ n: number }>`SELECT count(*)::int AS n FROM audit_log WHERE action LIKE ${like}`,
  ]);

  return (
    <>
      <PageTitle title="Journal" hint="Trace de ce qui s'est passé : paiements, actions admin, erreurs." />
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {Object.entries(TYPES).map(([k, v]) => (
          <a key={k} href={k ? `/admin/journal?type=${k}` : "/admin/journal"} aria-current={k === type ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${k === type ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>
            {v.label}
          </a>
        ))}
      </div>
      <div className="bg-card divide-y rounded-xl border text-sm">
        {rows.length === 0 && <p className="text-muted-foreground p-8 text-center">Rien dans cette catégorie.</p>}
        {rows.map((r) => (
          <div key={r.id} className="px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-xs font-medium">{r.action}</span>
              <span className="text-muted-foreground text-xs">{fmtDateTime(r.created_at)}</span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs break-all">
              {r.actor ? `par ${r.actor.slice(0, 8)}` : ""}{r.entity ? ` · ${r.entity} ${r.entity_id ?? ""}` : ""}
            </p>
            {r.meta != null && <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-2 text-xs">{JSON.stringify(r.meta, null, 1).slice(0, 600)}</pre>}
          </div>
        ))}
      </div>
      <Pager base="/admin/journal" params={{ type }} page={page} total={count[0]?.n ?? 0} />
    </>
  );
}
