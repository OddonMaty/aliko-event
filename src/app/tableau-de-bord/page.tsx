import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCategory, TIER_INFO, type Tier } from "@/lib/catalog";
import { q } from "@/lib/db";
import { lastOnlineDay, parseStoredContent } from "@/lib/invitations";
import { getTemplate } from "@/lib/templates";
import { formatDateFr } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes invitations", robots: { index: false } };

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" }> = {
  awaiting_payment: { label: "Paiement en attente", variant: "outline" },
  draft: { label: "Brouillon", variant: "secondary" },
  published: { label: "Publiée", variant: "success" },
  suspended: { label: "Suspendue", variant: "destructive" },
  archived: { label: "Archivée", variant: "outline" },
};

export default async function DashboardPage() {
  const user = await requireUser("/tableau-de-bord");
  const rows = await q<{
    id: string; slug: string; template_id: string; category: string; tier: Tier; status: string; content: unknown;
    order_id: string; rsvp_count: number;
  }>`
    SELECT i.id, i.slug, i.template_id, i.category, i.tier, i.status, i.content, i.order_id,
           (SELECT count(*)::int FROM rsvps r WHERE r.invitation_id = i.id) AS rsvp_count
    FROM invitations i WHERE i.user_id = ${user.id} ORDER BY i.created_at DESC`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Mes invitations</h1>
            <p className="text-muted-foreground mt-1 text-sm">Bonjour {user.name}.</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === "admin" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin">Administration</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/modeles">
                <Plus /> Nouvelle invitation
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>

        {rows.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <p className="mb-4 font-serif text-xl">Vous n'avez pas encore d'invitation.</p>
              <Button asChild>
                <Link href="/modeles">Choisir un design</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const content = parseStoredContent(r.content);
              const st = STATUS[r.status] ?? STATUS.draft;
              const href = r.status === "awaiting_payment" ? `/acheter/retour?order=${r.order_id}` : `/tableau-de-bord/${r.id}`;
              return (
                <Card key={r.id} className="py-4">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-serif text-lg font-semibold">{content.title}</p>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {getCategory(r.category)?.label} · {getTemplate(r.template_id)?.name} · {TIER_INFO[r.tier].label}
                        {content.date ? ` · ${formatDateFr(content.date, "long")}` : ""}
                      </p>
                      {r.status !== "awaiting_payment" && (
                        <p className="text-muted-foreground text-xs">
                          {r.rsvp_count} réponse(s)
                          {content.date && lastOnlineDay(content.date) ? ` · en ligne jusqu'au ${formatDateFr(lastOnlineDay(content.date)!, "long")}` : ""}
                        </p>
                      )}
                    </div>
                    <Button asChild variant={r.status === "awaiting_payment" ? "outline" : "default"} size="sm">
                      <Link href={href}>{r.status === "awaiting_payment" ? "Voir le paiement" : "Gérer"}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
