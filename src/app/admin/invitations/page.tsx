import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fmtDate, likeOf, PAGE_SIZE, pageOf } from "@/lib/admin";
import { getCategory } from "@/lib/catalog";
import { q } from "@/lib/db";
import { moderateInvitation } from "../actions";
import { ConfirmButton } from "../confirm-button";
import { Filters, INV_STATUS, PageTitle, Pager, StatusBadge } from "../ui";

type SP = { q?: string; status?: string; page?: string };

export default async function InvitationsAdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const like = likeOf(sp.q);
  const status = Object.prototype.hasOwnProperty.call(INV_STATUS, sp.status ?? "") ? sp.status! : "";
  const page = pageOf(sp.page);

  const [rows, count] = await Promise.all([
    q<{
      id: string; slug: string; status: string; category: string; tier: string; title: string | null; event_date: string | null;
      expires_at: string | null; created_at: string; email: string; rsvps: number; guests: number; couples: number;
    }>`
      SELECT i.id, i.slug, i.status, i.category, i.tier, i.content->>'title' AS title, i.event_date::text AS event_date, i.expires_at, i.created_at, u.email,
             (SELECT count(*)::int FROM rsvps r WHERE r.invitation_id = i.id) AS rsvps,
             (SELECT count(*)::int FROM guests g WHERE g.invitation_id = i.id) AS guests,
             (SELECT count(*)::int FROM guests g WHERE g.invitation_id = i.id AND g.party_type = 'couple') AS couples
      FROM invitations i JOIN users u ON u.id = i.user_id
      WHERE (${status} = '' OR i.status = ${status})
        AND (${like} = '' OR i.slug ILIKE ${like} OR u.email ILIKE ${like} OR i.content->>'title' ILIKE ${like})
      ORDER BY i.created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    q<{ n: number }>`
      SELECT count(*)::int AS n FROM invitations i JOIN users u ON u.id = i.user_id
      WHERE (${status} = '' OR i.status = ${status})
        AND (${like} = '' OR i.slug ILIKE ${like} OR u.email ILIKE ${like} OR i.content->>'title' ILIKE ${like})`,
  ]);

  return (
    <>
      <PageTitle title="Invitations" hint="Toutes les invitations du service : suspendre, rétablir ou supprimer." />
      <Filters q={sp.q} status={status} placeholder="Titre, lien ou e-mail du client" options={Object.entries(INV_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
      <ul className="space-y-2">
        {rows.map((i) => (
          <li key={i.id} className="bg-card rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{i.title ?? "(sans titre)"}</p>
                <p className="text-muted-foreground text-xs break-all">{i.email} · {getCategory(i.category)?.label ?? i.category} · {i.tier}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Événement : {fmtDate(i.event_date)} · expire : {fmtDate(i.expires_at)} · {i.guests} invité(s){i.couples ? ` (dont ${i.couples} en couple)` : ""} · {i.rsvps} réponse(s)
                </p>
              </div>
              <StatusBadge map={INV_STATUS} value={i.status} />
            </div>
            <form action={moderateInvitation} className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              <input type="hidden" name="invitationId" value={i.id} />
              {i.status === "published" && (
                <Button asChild variant="outline" size="sm"><a href={`/i/${i.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Voir</a></Button>
              )}
              {(i.status === "draft" || i.status === "published") && <Button type="submit" name="action" value="suspend" variant="outline" size="sm">Suspendre</Button>}
              {i.status === "suspended" && <Button type="submit" name="action" value="restore" variant="outline" size="sm">Rétablir</Button>}
              <ConfirmButton message="Supprimer définitivement cette invitation, ses invités, réponses et photos ? Cette action est irréversible." name="action" value="delete" variant="destructive" size="sm">Supprimer</ConfirmButton>
            </form>
          </li>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">Aucune invitation ne correspond.</p>}
      </ul>
      <Pager base="/admin/invitations" params={{ q: sp.q, status }} page={page} total={count[0]?.n ?? 0} />
    </>
  );
}
