import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, TIERS, TIER_INFO } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { updateSettings } from "../actions";
import { ConfirmButton } from "../confirm-button";
import { PageTitle, Panel } from "../ui";

const SAVED: Record<string, string> = {
  prix: "Prix enregistrés.",
  formules: "Formules enregistrées.",
  boissons: "Boissons enregistrées.",
  invites: "Réglages des invitations enregistrés.",
  reset: "Réglages remis aux valeurs d'origine.",
};
const usd = (c: number) => (c / 100).toFixed(2);
const label = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function Save({ section }: { section: string }) {
  return (
    <div className="mt-4 flex justify-end border-t pt-4">
      <input type="hidden" name="section" value={section} />
      <Button type="submit">Enregistrer</Button>
    </div>
  );
}

function Num({ name, defaultValue, step = 1, min = 0, max, label: l }: { name: string; defaultValue: number | string; step?: number | string; min?: number; max?: number; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs">{l}</Label>
      <Input id={name} name={name} type="number" inputMode="decimal" defaultValue={defaultValue} step={step} min={min} max={max} required />
    </div>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const s = await getSettings();
  const presets = s.drinks.presets;

  return (
    <>
      <PageTitle title="Réglages" hint="Prix, formules, boissons et options des invitations. Les changements s'appliquent tout de suite aux nouvelles ventes et aux invitations en cours." />

      {saved && SAVED[saved] && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />{SAVED[saved]}
        </p>
      )}

      <div className="space-y-4">
        <form action={updateSettings}>
          <Panel title="Prix" hint="En dollars. Prix de base pour 50 invités, puis un supplément par invité au-delà. Les commandes déjà payées ne changent pas.">
            <div className="space-y-4">
              {CATEGORIES.map((c) => (
                <fieldset key={c.id} className="rounded-lg border p-3">
                  <legend className="px-1 text-sm font-medium">{c.label}</legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {TIERS.map((t) => (
                      <Num key={t} name={`price:${c.id}:${t}`} label={label(t)} defaultValue={usd(s.prices[c.id]![t])} step="0.01" min={1} />
                    ))}
                    <Num name={`extra:${c.id}`} label="Par invité en plus" defaultValue={usd(s.prices[c.id]!.extraGuestCents)} step="0.01" />
                  </div>
                </fieldset>
              ))}
              <div className="space-y-1.5">
                <Label htmlFor="guestLimits" className="text-xs">Paliers d&apos;invités proposés (séparés par des virgules)</Label>
                <Input id="guestLimits" name="guestLimits" defaultValue={s.guestLimits.join(", ")} inputMode="numeric" required />
                <p className="text-muted-foreground text-xs">50 est toujours proposé : c&apos;est la base du tarif. Maximum 8 paliers, de 10 à 5000.</p>
              </div>
            </div>
            <Save section="prix" />
          </Panel>
        </form>

        <form action={updateSettings}>
          <Panel title="Formules" hint="Ce que chaque formule autorise. Le texte des formules sur le site se met à jour tout seul.">
            <div className="grid gap-3 sm:grid-cols-3">
              {TIERS.map((t) => (
                <fieldset key={t} className="rounded-lg border p-3">
                  <legend className="px-1 text-sm font-medium">{TIER_INFO[t].label}</legend>
                  <div className="space-y-3">
                    <Num name={`photos:${t}`} label="Photos (1 à 12)" defaultValue={s.tiers[t].maxPhotos} min={1} max={12} />
                    <Num name={`program:${t}`} label="Étapes du programme (0 à 12)" defaultValue={s.tiers[t].maxProgram} min={0} max={12} />
                  </div>
                </fieldset>
              ))}
            </div>
            <p className="text-muted-foreground mt-3 text-xs">Mettre 0 étape retire le programme de la formule. Si vous réduisez une limite, les invitations qui la dépassent devront être ajustées à leur prochaine sauvegarde.</p>
            <Save section="formules" />
          </Panel>
        </form>

        <form action={updateSettings}>
          <Panel title="Boissons" hint="La liste proposée aux organisateurs, et celles cochées d'office dans les nouvelles invitations.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="presets" className="text-xs">Boissons proposées (une par ligne)</Label>
                <textarea id="presets" name="presets" rows={10} defaultValue={presets.join("\n")} className="border-input bg-background w-full rounded-md border px-3 py-2 text-base md:text-sm" required />
              </div>
              <div className="space-y-3">
                <fieldset className="space-y-2">
                  <legend className="text-xs font-medium">Cochées d&apos;office dans les nouvelles invitations</legend>
                  <div className="grid max-h-56 gap-1 overflow-y-auto pr-1">
                    {presets.map((d) => (
                      <label key={d} className="flex min-h-9 items-center gap-2 text-sm">
                        <input type="checkbox" name={`default:${d}`} defaultChecked={s.drinks.defaults.includes(d)} className="accent-primary size-4" />{d}
                      </label>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">Après avoir ajouté une boisson dans la liste, enregistrez, puis cochez-la ici.</p>
                </fieldset>
                <Num name="max" label="Boissons maximum par invitation (1 à 20)" defaultValue={s.drinks.max} min={1} max={20} />
              </div>
            </div>
            <Save section="boissons" />
          </Panel>
        </form>

        <form action={updateSettings}>
          <Panel title="Invitations" hint="Ce que vos clients peuvent proposer à leurs invités.">
            <div className="max-w-xs">
              <Num name="maxPartySize" label="Personnes maximum par réponse (1 à 20)" defaultValue={s.rsvp.maxPartySize} min={1} max={20} />
              <p className="text-muted-foreground mt-1.5 text-xs">Nombre de personnes qu&apos;un invité peut déclarer en répondant (lui compris).</p>
            </div>
            <fieldset className="mt-5 space-y-2">
              <legend className="text-xs font-medium">Sections disponibles</legend>
              {([["guestbook", "Mots doux (messages publics des invités)", s.sections.guestbook], ["map", "Carte du lieu", s.sections.map], ["drinks", "Choix de boisson", s.sections.drinks]] as const).map(([k, l, on]) => (
                <label key={k} className="flex min-h-10 items-center gap-3 text-sm">
                  <input type="checkbox" name={k} defaultChecked={on} className="accent-primary size-4" />{l}
                </label>
              ))}
              <p className="text-muted-foreground text-xs">Une section décochée disparaît du formulaire des organisateurs et des invitations déjà publiées.</p>
            </fieldset>
            <Save section="invites" />
          </Panel>
        </form>

        <form action={updateSettings} className="flex justify-end">
          <input type="hidden" name="section" value="reset" />
          <ConfirmButton message="Remettre tous les réglages (prix, formules, boissons, sections) aux valeurs d'origine ?" variant="outline" size="sm">Remettre aux valeurs d&apos;origine</ConfirmButton>
        </form>
      </div>
    </>
  );
}
