import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/admin";
import { q } from "@/lib/db";
import { moderateInvitation } from "../actions";
import { PageTitle, Panel } from "../ui";

export default async function ModerationPage() {
  const [reports, suspended] = await Promise.all([
    q<{ id: string; slug: string; status: string; title: string | null; reports: number; reasons: string[]; details: string[]; last_at: string }>`
      SELECT i.id, i.slug, i.status, i.content->>'title' AS title, count(*)::int AS reports,
             array_agg(DISTINCT r.reason) AS reasons,
             COALESCE(array_agg(DISTINCT r.details) FILTER (WHERE r.details IS NOT NULL AND r.details <> ''), '{}') AS details,
             max(r.created_at) AS last_at
      FROM abuse_reports r JOIN invitations i ON i.id = r.invitation_id
      WHERE r.status = 'open'
      GROUP BY i.id ORDER BY count(*) DESC, max(r.created_at) DESC LIMIT 100`,
    q<{ id: string; slug: string; title: string | null }>`
      SELECT id, slug, content->>'title' AS title FROM invitations WHERE status = 'suspended' ORDER BY updated_at DESC LIMIT 50`,
  ]);

  return (
    <>
      <PageTitle title="Modération" hint="Signalements des invités : examinez, puis suspendez ou ignorez." />
      <div className="space-y-4">
        <Panel title={`Signalements ouverts (${reports.length})`}>
          {reports.length === 0 && <p className="text-muted-foreground text-sm">Aucun signalement à traiter.</p>}
          <ul className="divide-y">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 space-y-1.5">
                  <p className="font-medium">{r.title ?? "(sans titre)"}</p>
                  <p className="text-muted-foreground text-xs">/i/{r.slug} · dernier signalement {fmtDateTime(r.last_at)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="destructive">{r.reports} signalement(s)</Badge>
                    {r.reasons.map((x) => <Badge key={x} variant="outline">{x}</Badge>)}
                  </div>
                  {r.details.map((d) => <p key={d} className="bg-accent/40 rounded-md px-3 py-2 text-sm break-words">{d}</p>)}
                </div>
                <form action={moderateInvitation} className="flex flex-wrap gap-2">
                  <input type="hidden" name="invitationId" value={r.id} />
                  <Button asChild variant="outline" size="sm"><a href={`/i/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Voir</a></Button>
                  <Button type="submit" name="action" value="dismiss" variant="outline" size="sm">Ignorer</Button>
                  <Button type="submit" name="action" value="suspend" variant="destructive" size="sm">Suspendre</Button>
                </form>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={`Invitations suspendues (${suspended.length})`}>
          {suspended.length === 0 && <p className="text-muted-foreground text-sm">Aucune.</p>}
          <ul className="divide-y text-sm">
            {suspended.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="min-w-0 truncate">{s.title ?? "(sans titre)"} <span className="text-muted-foreground">· /i/{s.slug}</span></span>
                <form action={moderateInvitation}>
                  <input type="hidden" name="invitationId" value={s.id} />
                  <Button type="submit" name="action" value="restore" variant="outline" size="sm">Rétablir</Button>
                </form>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
