"use client";

import { useState } from "react";
import { Download, Loader2, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/copy-button";
import { InvitationView } from "@/components/invitation/invitation-view";
import { PhotoUploader } from "@/components/photo-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TIER_INFO, type Tier } from "@/lib/catalog";
import type { InvitationContent } from "@/lib/content";
import type { Template } from "@/lib/templates";
import { formatDateFr } from "@/lib/utils";

export interface RsvpItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  attendance: "yes" | "no" | "maybe";
  party_size: number;
  message: string | null;
  created_at: string;
}

interface Props {
  invitation: { id: string; slug: string; status: "draft" | "published" | "suspended" | "archived"; tier: Tier };
  template: Template;
  initialContent: InvitationContent;
  rsvps: RsvpItem[];
  baseUrl: string;
}

const ATT: Record<RsvpItem["attendance"], { label: string; variant: "success" | "destructive" | "secondary" }> = {
  yes: { label: "Présent", variant: "success" },
  no: { label: "Absent", variant: "destructive" },
  maybe: { label: "Peut-être", variant: "secondary" },
};

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

export function Editor({ invitation, template, initialContent, rsvps, baseUrl }: Props) {
  const info = TIER_INFO[invitation.tier];
  const [content, setContent] = useState<InvitationContent>(initialContent);
  const [slug, setSlug] = useState(invitation.slug);
  const [savedSlug, setSavedSlug] = useState(invitation.slug);
  const [status, setStatus] = useState(invitation.status);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const editable = status === "draft" || status === "published";
  const link = `${baseUrl}/i/${savedSlug}`;
  const set = <K extends keyof InvitationContent>(key: K, value: InvitationContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  async function save(silent = false): Promise<boolean> {
    setSaving(true);
    try {
      const res = await fetch(`/api/invitations/${invitation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, program: content.program.filter((s) => s.label.trim() !== "") },
          slug: info.customSlug && slug !== savedSlug ? slug : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Enregistrement impossible");
      setSavedSlug(data.slug);
      setSlug(data.slug);
      if (!silent) toast.success("Modifications enregistrées");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      if (!(await save(true))) return;
      const res = await fetch(`/api/invitations/${invitation.id}/publish`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Publication impossible");
      setStatus("published");
      toast.success("Invitation publiée ! Partagez votre lien.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publication impossible");
    } finally {
      setPublishing(false);
    }
  }

  const counts = {
    yes: rsvps.filter((r) => r.attendance === "yes").reduce((n, r) => n + r.party_size, 0),
    no: rsvps.filter((r) => r.attendance === "no").length,
    maybe: rsvps.filter((r) => r.attendance === "maybe").length,
  };

  const preview = <InvitationView content={content} template={template} brand={!info.brandingFree} />;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Vous êtes invité(e) : ${content.title}\n${link}`)}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={status === "published" ? "success" : status === "suspended" ? "destructive" : "secondary"}>
              {status === "published" ? "Publiée" : status === "draft" ? "Brouillon" : status === "suspended" ? "Suspendue" : "Archivée"}
            </Badge>
            <Badge variant="outline">{info.label}</Badge>
          </div>
          {editable && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => save()} disabled={saving || publishing}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />} Enregistrer
              </Button>
              {status === "draft" && (
                <Button onClick={publish} disabled={saving || publishing}>
                  {publishing ? <Loader2 className="animate-spin" /> : <Send />} Publier
                </Button>
              )}
            </div>
          )}
        </div>

        {status === "suspended" && (
          <Card className="border-destructive/50">
            <CardContent className="text-sm">
              Cette invitation a été suspendue suite à un signalement. Contactez le support pour plus d'informations.
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="contenu">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="contenu">Contenu</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="partage">Partage</TabsTrigger>
            <TabsTrigger value="reponses">Réponses ({rsvps.length})</TabsTrigger>
            <TabsTrigger value="apercu" className="lg:hidden">Aperçu</TabsTrigger>
          </TabsList>

          {/* CONTENU */}
          <TabsContent value="contenu">
            <fieldset disabled={!editable} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>L'événement</CardTitle>
                  <CardDescription>Ces informations s'affichent en haut de votre invitation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field id="eyebrow" label="Phrase d'accroche">
                    <Input id="eyebrow" value={content.eyebrow} maxLength={80} onChange={(e) => set("eyebrow", e.target.value)} />
                  </Field>
                  <Field id="title" label="Titre" hint="Par exemple : « Jean & Marie »">
                    <Input id="title" value={content.title} maxLength={80} onChange={(e) => set("title", e.target.value)} />
                  </Field>
                  <Field id="subtitle" label="Sous-titre">
                    <Input id="subtitle" value={content.subtitle} maxLength={120} onChange={(e) => set("subtitle", e.target.value)} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="date" label="Date">
                      <Input id="date" type="date" value={content.date} onChange={(e) => set("date", e.target.value)} />
                    </Field>
                    <Field id="time" label="Heure">
                      <Input id="time" type="time" value={content.time} onChange={(e) => set("time", e.target.value)} />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lieu et détails</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field id="venue" label="Nom du lieu">
                    <Input id="venue" value={content.venueName} maxLength={100} onChange={(e) => set("venueName", e.target.value)} />
                  </Field>
                  <Field id="address" label="Adresse">
                    <Input id="address" value={content.address} maxLength={200} onChange={(e) => set("address", e.target.value)} />
                  </Field>
                  <Field id="map" label="Lien de la carte (optionnel)" hint="Google Maps, OpenStreetMap ou Waze uniquement.">
                    <Input id="map" type="url" value={content.mapUrl} maxLength={400} placeholder="https://maps.app.goo.gl/…" onChange={(e) => set("mapUrl", e.target.value)} />
                  </Field>
                  <Field id="message" label="Message">
                    <Textarea id="message" rows={4} value={content.message} maxLength={600} onChange={(e) => set("message", e.target.value)} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="dress" label="Code vestimentaire">
                      <Input id="dress" value={content.dressCode} maxLength={80} onChange={(e) => set("dressCode", e.target.value)} />
                    </Field>
                    <Field id="contact" label="Téléphone de contact">
                      <Input id="contact" type="tel" value={content.contactPhone} maxLength={30} onChange={(e) => set("contactPhone", e.target.value)} />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Programme</CardTitle>
                  <CardDescription>
                    {info.maxProgram > 0 ? "Les grandes étapes de la journée." : "Disponible à partir de la formule Standard."}
                  </CardDescription>
                </CardHeader>
                {info.maxProgram > 0 && (
                  <CardContent className="space-y-3">
                    {content.program.map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          type="time"
                          className="w-32"
                          value={step.time}
                          aria-label="Heure"
                          onChange={(e) => set("program", content.program.map((s, j) => (j === i ? { ...s, time: e.target.value } : s)))}
                        />
                        <Input
                          value={step.label}
                          maxLength={80}
                          aria-label="Étape"
                          placeholder="Ex. Cérémonie religieuse"
                          onChange={(e) => set("program", content.program.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)))}
                        />
                        <Button type="button" variant="ghost" size="icon" aria-label="Supprimer" onClick={() => set("program", content.program.filter((_, j) => j !== i))}>
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={content.program.length >= info.maxProgram}
                      onClick={() => set("program", [...content.program, { time: "", label: "" }])}
                    >
                      <Plus /> Ajouter une étape
                    </Button>
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Confirmation de présence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="accent-primary size-4"
                      checked={content.rsvpEnabled}
                      onChange={(e) => set("rsvpEnabled", e.target.checked)}
                    />
                    Permettre à mes invités de confirmer leur présence
                  </label>
                  {content.rsvpEnabled && (
                    <Field id="deadline" label="Date limite de réponse (optionnel)">
                      <Input id="deadline" type="date" value={content.rsvpDeadline} onChange={(e) => set("rsvpDeadline", e.target.value)} />
                    </Field>
                  )}
                </CardContent>
              </Card>
            </fieldset>
          </TabsContent>

          {/* PHOTOS */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>Votre formule {info.label} autorise {info.maxPhotos} photo(s).</CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoUploader
                  invitationId={invitation.id}
                  photos={content.photos}
                  max={info.maxPhotos}
                  onChange={(p) => set("photos", p)}
                />
                <p className="text-muted-foreground mt-4 text-xs">N'oubliez pas d'enregistrer après avoir ajouté ou retiré des photos.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PARTAGE */}
          <TabsContent value="partage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lien de votre invitation</CardTitle>
                <CardDescription>
                  {status === "published"
                    ? "Envoyez ce lien uniquement aux personnes que vous invitez."
                    : "Le lien sera actif une fois l'invitation publiée."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm">
                  <span className="truncate">{link}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={link} />
                  <Button asChild variant="outline" size="sm">
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer">Partager sur WhatsApp</a>
                  </Button>
                  {status === "draft" && (
                    <Button size="sm" onClick={publish} disabled={publishing || saving}>
                      <Send /> Publier maintenant
                    </Button>
                  )}
                </div>
                {info.customSlug && editable && (
                  <Field id="slug" label="Lien personnalisé (Premium)" hint="3 à 40 caractères : lettres minuscules, chiffres et tirets.">
                    <div className="flex gap-2">
                      <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} />
                      <Button type="button" variant="outline" onClick={() => save()} disabled={saving || slug === savedSlug}>
                        Appliquer
                      </Button>
                    </div>
                  </Field>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>QR code</CardTitle>
                <CardDescription>À imprimer sur un carton ou à partager. Il mène à votre invitation.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/invitations/${invitation.id}/qr?format=svg&v=${savedSlug}`}
                  alt="QR code de l'invitation"
                  className="size-40 rounded-md border bg-white p-1"
                />
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={`/api/invitations/${invitation.id}/qr?format=png&download=1`}><Download /> Télécharger PNG</a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={`/api/invitations/${invitation.id}/qr?format=svg&download=1`}><Download /> Télécharger SVG</a>
                  </Button>
                  {info.soon.length > 0 && <p className="text-muted-foreground text-xs">Bientôt : {info.soon.join(", ").toLowerCase()}.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RÉPONSES */}
          <TabsContent value="reponses">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle>Réponses de vos invités</CardTitle>
                  <CardDescription>
                    {counts.yes} personne(s) présente(s) · {counts.no} absent(s) · {counts.maybe} peut-être
                  </CardDescription>
                </div>
                {info.csv ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={`/api/invitations/${invitation.id}/export`}><Download /> Exporter</a>
                  </Button>
                ) : (
                  <Badge variant="outline">Export : formule Standard</Badge>
                )}
              </CardHeader>
              <CardContent>
                {rsvps.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-sm">Aucune réponse pour le moment.</p>
                ) : (
                  <ul className="divide-y">
                    {rsvps.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                        <div>
                          <p className="font-medium">
                            {r.name} {r.party_size > 1 && <span className="text-muted-foreground">(+{r.party_size - 1})</span>}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {[r.phone, r.email].filter(Boolean).join(" · ")}
                            {(r.phone || r.email) && " · "}
                            {formatDateFr(r.created_at.slice(0, 10), "long")}
                          </p>
                          {r.message && <p className="mt-1 italic">« {r.message} »</p>}
                        </div>
                        <Badge variant={ATT[r.attendance].variant}>{ATT[r.attendance].label}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apercu" className="lg:hidden">
            <div className="mx-auto max-w-md overflow-hidden rounded-2xl border shadow-lg">{preview}</div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Aperçu en direct (grand écran) */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="text-muted-foreground mb-3 text-center text-xs tracking-widest uppercase">Aperçu en direct</p>
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border shadow-lg">{preview}</div>
        </div>
      </aside>
    </div>
  );
}
