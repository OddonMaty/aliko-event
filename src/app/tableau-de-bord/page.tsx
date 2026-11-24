import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { ConfirmButton } from "@/components/confirm-button";
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
import { deleteMyInvitation } from "./actions";

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
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Mes invitations</h1>
            <p className="text-muted-foreground mt-1 text-sm">Bonjour {user.name}.</p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
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

        {/* Bouton d'action flottant (téléphone) */}
        <Button asChild size="lg" className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 h-14 rounded-full px-5 shadow-lg md:hidden">
          <Link href="/modeles">
            <Plus /> Nouvelle invitation
          </Link>
        </Button>

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
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button asChild variant={r.status === "awaiting_payment" ? "outline" : "default"} size="sm" className="flex-1 sm:flex-none">
                        <Link href={href}>{r.status === "awaiting_payment" ? "Voir le paiement" : "Gérer"}</Link>
                      </Button>
                      <form action={deleteMyInvitation}>
                        <input type="hidden" name="invitationId" value={r.id} />
                        <ConfirmButton
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          message={
                            r.status === "awaiting_payment"
                              ? "Annuler cette commande et supprimer l'invitation ?"
                              : "Supprimer définitivement cette invitation, ses réponses, invités et photos ? Le lien partagé ne fonctionnera plus. Cette action est irréversible et n'ouvre pas droit à un remboursement."
                          }
                        >
                          {r.status === "awaiting_payment" ? "Annuler" : "Supprimer"}
                        </ConfirmButton>
                      </form>
                    </div>
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
