import type { Metadata } from "next";
import Link from "next/link";
import { BellOff, MessageSquareHeart, Phone, Mail, Users, Wine, MessageCircle } from "lucide-react";

import { PushToggle } from "@/components/push-toggle";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import type { RsvpPayload } from "@/lib/notify";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };
export const dynamic = "force-dynamic";

interface Row {
  id: string; invitation_id: string; kind: "rsvp" | "rsvp_update" | "guestbook"; title: string;
  payload: Partial<RsvpPayload> & { message?: string | null }; read_at: string | null; created_at: string; inv_title: string | null;
}

const ATT = {
  yes: { label: "Présent", variant: "success" },
  no: { label: "Absent", variant: "destructive" },
  maybe: { label: "Peut-être", variant: "secondary" },
} as const;

const when = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kinshasa" }).format(new Date(iso));

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const rows = await q<Row>`
    SELECT n.id, n.invitation_id, n.kind, n.title, n.payload, n.read_at, n.created_at, i.content->>'title' AS inv_title
    FROM notifications n JOIN invitations i ON i.id = n.invitation_id
    WHERE n.user_id = ${user.id} ORDER BY n.created_at DESC LIMIT 100`;
  // Elles sont marquées comme lues après cet affichage ; celles qui étaient nouvelles gardent leur pastille.
  await q`UPDATE notifications SET read_at = now() WHERE user_id = ${user.id} AND read_at IS NULL`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
        <h1 className="font-serif text-3xl">Notifications</h1>
        <p className="text-muted-foreground mt-1 text-sm">Les réponses de vos invités, avec tout ce qu&apos;ils ont rempli.</p>
        <div className="mt-4"><PushToggle /></div>

        {rows.length === 0 ? (
          <div className="text-muted-foreground mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center text-sm">
            <BellOff className="size-8" />
            <p>Rien pour l&apos;instant. Dès qu&apos;un invité répond, vous le verrez ici.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((n) => {
              const p = n.payload;
              const isNew = !n.read_at;
              const att = p.attendance ? ATT[p.attendance] : null;
              return (
                <li key={n.id}>
                  <Card className={isNew ? "border-primary/50" : undefined}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {isNew && <span className="bg-primary mr-2 inline-block size-2 rounded-full align-middle" aria-label="Nouveau" />}
                            {n.title}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {n.inv_title ?? "Invitation"} · {when(n.created_at)}
                            {n.kind === "rsvp_update" && " · réponse modifiée"}
                          </p>
                        </div>
                        {att && <Badge variant={att.variant}>{att.label}</Badge>}
                      </div>

                      {n.kind === "guestbook" ? (
                        <p className="bg-accent/40 flex gap-2 rounded-lg p-3 text-sm">
                          <MessageSquareHeart className="text-primary mt-0.5 size-4 shrink-0" />
                          <span className="break-words">{p.message}</span>
                        </p>
                      ) : (
                        <dl className="grid gap-2 text-sm">
                          {!!p.partySize && <Detail icon={Users} label="Personnes">{p.partySize}</Detail>}
                          {p.phone && <Detail icon={Phone} label="Téléphone"><a className="underline-offset-4 hover:underline" href={`tel:${p.phone}`}>{p.phone}</a></Detail>}
                          {p.email && <Detail icon={Mail} label="E-mail">{p.email}</Detail>}
                          {p.drink && <Detail icon={Wine} label="Boisson">{p.drink}</Detail>}
                          {p.message && <Detail icon={MessageCircle} label="Message">{p.message}</Detail>}
                        </dl>
                      )}

                      <Link href={`/tableau-de-bord/${n.invitation_id}?tab=reponses`} className="text-primary inline-flex min-h-10 items-center text-sm font-medium underline-offset-4 hover:underline">
                        Voir toutes les réponses
                      </Link>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function Detail({ icon: Icon, label, children }: { icon: typeof Users; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
      <dt className="text-muted-foreground w-24 shrink-0">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
