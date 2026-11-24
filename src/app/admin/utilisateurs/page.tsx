import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtDate, likeOf, PAGE_SIZE, pageOf, requireAdmin } from "@/lib/admin";
import { q } from "@/lib/db";
import { formatUsdCents } from "@/lib/money";
import { updateUser } from "../actions";
import { ConfirmButton } from "../confirm-button";
import { Filters, PageTitle, Pager } from "../ui";

type SP = { q?: string; status?: string; page?: string };

export default async function UsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const like = likeOf(sp.q);
  const filter = ["admin", "disabled"].includes(sp.status ?? "") ? sp.status! : "";
  const page = pageOf(sp.page);

  const [rows, count] = await Promise.all([
    q<{
      id: string; name: string; email: string; phone: string | null; role: string; disabled_at: string | null; created_at: string;
      invitations: number; spent: number;
    }>`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.disabled_at, u.created_at,
             (SELECT count(*)::int FROM invitations i WHERE i.user_id = u.id) AS invitations,
             (SELECT COALESCE(sum(o.amount_usd_cents),0)::int FROM orders o WHERE o.user_id = u.id AND o.status = 'paid') AS spent
      FROM users u
      WHERE (${like} = '' OR u.email ILIKE ${like} OR u.name ILIKE ${like} OR u.phone ILIKE ${like})
        AND (${filter} = '' OR (${filter} = 'admin' AND u.role = 'admin') OR (${filter} = 'disabled' AND u.disabled_at IS NOT NULL))
      ORDER BY u.created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    q<{ n: number }>`
      SELECT count(*)::int AS n FROM users u
      WHERE (${like} = '' OR u.email ILIKE ${like} OR u.name ILIKE ${like} OR u.phone ILIKE ${like})
        AND (${filter} = '' OR (${filter} = 'admin' AND u.role = 'admin') OR (${filter} = 'disabled' AND u.disabled_at IS NOT NULL))`,
  ]);

  return (
    <>
      <PageTitle title="Utilisateurs" hint="Comptes, rôles et accès." />
      <Filters q={sp.q} status={filter} placeholder="Nom, e-mail ou téléphone" options={[{ value: "admin", label: "Administrateurs" }, { value: "disabled", label: "Comptes bloqués" }]} />
      <ul className="space-y-2">
        {rows.map((u) => (
          <li key={u.id} className="bg-card rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {u.name}
                  {u.role === "admin" && <Badge>Admin</Badge>}
                  {u.disabled_at && <Badge variant="destructive">Bloqué</Badge>}
                </p>
                <p className="text-muted-foreground text-sm break-all">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">Inscrit le {fmtDate(u.created_at)}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold tabular-nums">{formatUsdCents(u.spent)}</p>
                <p className="text-muted-foreground text-xs">{u.invitations} invitation(s)</p>
              </div>
            </div>
            {u.id !== me.id && (
              <form action={updateUser} className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                <input type="hidden" name="userId" value={u.id} />
                {u.role === "admin" ? (
                  <Button type="submit" name="action" value="remove_admin" variant="outline" size="sm">Retirer l&apos;accès admin</Button>
                ) : (
                  <ConfirmButton message="Donner un accès administrateur complet à cette personne ?" name="action" value="make_admin" variant="outline" size="sm">Nommer administrateur</ConfirmButton>
                )}
                {u.role !== "admin" && (u.disabled_at ? (
                  <Button type="submit" name="action" value="enable" variant="outline" size="sm">Débloquer</Button>
                ) : (
                  <ConfirmButton message="Bloquer ce compte ? La personne ne pourra plus se connecter." name="action" value="disable" variant="destructive" size="sm">Bloquer le compte</ConfirmButton>
                ))}
              </form>
            )}
          </li>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">Aucun utilisateur ne correspond.</p>}
      </ul>
      <Pager base="/admin/utilisateurs" params={{ q: sp.q, status: filter }} page={page} total={count[0]?.n ?? 0} />
    </>
  );
}
