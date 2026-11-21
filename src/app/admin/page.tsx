import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { isUuid } from "@/lib/invitations";
import { audit } from "@/lib/security";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

async function moderate(formData: FormData) {
  "use server";
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") throw new Error("Non autorisé");
  const id = String(formData.get("invitationId") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!isUuid(id)) throw new Error("Identifiant invalide");

  if (action === "suspend") {
    await q`UPDATE invitations SET status = 'suspended', updated_at = now() WHERE id = ${id} AND status IN ('draft','published')`;
    await q`UPDATE abuse_reports SET status = 'reviewed' WHERE invitation_id = ${id} AND status = 'open'`;
  } else if (action === "restore") {
    await q`UPDATE invitations SET status = CASE WHEN published_at IS NOT NULL THEN 'published' ELSE 'draft' END, updated_at = now()
            WHERE id = ${id} AND status = 'suspended'`;
  } else if (action === "dismiss") {
    await q`UPDATE abuse_reports SET status = 'dismissed' WHERE invitation_id = ${id} AND status = 'open'`;
  } else {
    throw new Error("Action inconnue");
  }
  await audit(admin.id, `admin.${action}`, "invitation", id);
  revalidatePath("/admin");
}

export default async function AdminPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user || user.role !== "admin") notFound();

  const reports = await q<{
    id: string; slug: string; status: string; title: string | null; reports: number; reasons: string[]; last_at: Date;
  }>`
    SELECT i.id, i.slug, i.status, i.content->>'title' AS title, count(*)::int AS reports,
           array_agg(DISTINCT r.reason) AS reasons, max(r.created_at) AS last_at
    FROM abuse_reports r JOIN invitations i ON i.id = r.invitation_id
    WHERE r.status = 'open'
    GROUP BY i.id ORDER BY count(*) DESC, max(r.created_at) DESC LIMIT 100`;

  const suspended = await q<{ id: string; slug: string; title: string | null }>`
    SELECT id, slug, content->>'title' AS title FROM invitations WHERE status = 'suspended' ORDER BY updated_at DESC LIMIT 50`;

  const alerts = await q<{ id: number; action: string; entity_id: string | null; created_at: Date }>`
    SELECT id, action, entity_id, created_at FROM audit_log
    WHERE action LIKE 'order.%mismatch' OR action IN ('callback.unknown_order','order.provider_error')
    ORDER BY id DESC LIMIT 20`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-12">
        <h1 className="text-3xl font-semibold">Administration</h1>

        <Card>
          <CardHeader>
            <CardTitle>Signalements ouverts</CardTitle>
            <CardDescription>Suspendez les invitations frauduleuses ou inappropriées.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {reports.length === 0 && <p className="text-muted-foreground py-4 text-sm">Aucun signalement.</p>}
            {reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="space-y-1">
                  <p className="font-medium">{r.title ?? "(sans titre)"}</p>
                  <p className="text-muted-foreground text-xs">/i/{r.slug} · {new Date(r.last_at).toISOString().slice(0, 10)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="destructive">{r.reports} signalement(s)</Badge>
                    {r.reasons.map((x) => (
                      <Badge key={x} variant="outline">{x}</Badge>
                    ))}
                    <Badge variant="secondary">{r.status}</Badge>
                  </div>
                </div>
                <form action={moderate} className="flex gap-2">
                  <input type="hidden" name="invitationId" value={r.id} />
                  <Button type="submit" name="action" value="dismiss" variant="outline" size="sm">Ignorer</Button>
                  <Button type="submit" name="action" value="suspend" variant="destructive" size="sm">Suspendre</Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invitations suspendues</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {suspended.length === 0 && <p className="text-muted-foreground py-4 text-sm">Aucune.</p>}
            {suspended.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>{s.title ?? "(sans titre)"} · /i/{s.slug}</span>
                <form action={moderate}>
                  <input type="hidden" name="invitationId" value={s.id} />
                  <Button type="submit" name="action" value="restore" variant="outline" size="sm">Rétablir</Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertes paiement</CardTitle>
            <CardDescription>Écarts de montant ou de référence, callbacks inconnus, erreurs du prestataire.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {alerts.length === 0 && <p className="text-muted-foreground py-4">Rien à signaler.</p>}
            {alerts.map((a) => (
              <div key={a.id} className="flex justify-between gap-3 py-2">
                <span>{a.action} <span className="text-muted-foreground">· {a.entity_id ?? ""}</span></span>
                <span className="text-muted-foreground">{new Date(a.created_at).toISOString().slice(0, 16).replace("T", " ")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
