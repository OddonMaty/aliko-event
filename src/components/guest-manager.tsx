"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface GuestItem {
  id: string;
  name: string;
  token: string;
  attendance: "yes" | "no" | "maybe" | null;
}

const STATUS: Record<NonNullable<GuestItem["attendance"]> | "none", { label: string; variant: "success" | "destructive" | "secondary" | "outline" }> = {
  yes: { label: "Présent", variant: "success" },
  no: { label: "Absent", variant: "destructive" },
  maybe: { label: "Peut-être", variant: "secondary" },
  none: { label: "Sans réponse", variant: "outline" },
};

interface Props {
  invitationId: string;
  slug: string;
  title: string;
  baseUrl: string;
  published: boolean;
  cap: number;
  guests: GuestItem[];
}

export function GuestManager({ invitationId, slug, title, baseUrl, published, cap, guests }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function add() {
    const names = text.split(/\r?\n|,|;/).map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Ajout impossible");
      toast.success(`${data.added} invité(s) ajouté(s)`);
      setText("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ajout impossible");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setRemoving(id);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/guests?guestId=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Suppression impossible");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible");
    } finally {
      setRemoving(null);
    }
  }

  const linkFor = (g: GuestItem) => `${baseUrl}/i/${slug}?g=${g.token}`;
  const whatsappFor = (g: GuestItem) =>
    `https://wa.me/?text=${encodeURIComponent(`Bonjour ${g.name}, vous êtes invité(e) : ${title}\n${linkFor(g)}`)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vos invités</CardTitle>
        <CardDescription>
          Ajoutez vos invités : chacun reçoit un lien personnel (son prénom s&apos;affiche dans l&apos;invitation) et un pass QR
          individuel. {guests.length} / {cap}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="guest-names">Noms des invités (un par ligne)</Label>
          <Textarea
            id="guest-names"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Julie Mbuyi\nFamille Kasongo\nPasteur Daniel"}
          />
          <Button type="button" size="sm" onClick={add} disabled={busy || !text.trim()}>
            {busy ? <Loader2 className="animate-spin" /> : <Plus />} Ajouter
          </Button>
        </div>

        {!published && guests.length > 0 && (
          <p className="text-muted-foreground text-xs">Les liens personnels fonctionneront une fois l&apos;invitation publiée.</p>
        )}

        {guests.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {guests.map((g) => {
              const st = STATUS[g.attendance ?? "none"];
              return (
                <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="truncate text-sm font-medium">{g.name}</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CopyButton value={linkFor(g)} label="Lien" />
                    <Button asChild variant="outline" size="sm">
                      <a href={whatsappFor(g)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle /> WhatsApp
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Retirer ${g.name}`}
                      onClick={() => remove(g.id)}
                      disabled={removing === g.id}
                    >
                      {removing === g.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
