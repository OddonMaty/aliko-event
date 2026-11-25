import { CheckCircle2, CircleAlert, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/admin";
import { CATEGORIES, TIERS } from "@/lib/catalog";
import { q } from "@/lib/db";
import { formatUsdCents, usdCdfRate } from "@/lib/money";
import { isTestPayments } from "@/lib/testmode";
import { loadCatalog } from "@/lib/settings";
import { purgeStaleDrafts } from "../actions";
import { ConfirmButton } from "../confirm-button";
import { PageTitle, Panel } from "../ui";

const has = (...names: string[]) => names.every((n) => !!process.env[n]);

export default async function SystemPage() {
  await loadCatalog();
  const [db, lastPurge, stale, errors] = await Promise.all([
    q<{ size: string; users: number; invitations: number; rsvps: number }>`
      SELECT pg_size_pretty(pg_database_size(current_database())) AS size,
             (SELECT count(*)::int FROM users) AS users, (SELECT count(*)::int FROM invitations) AS invitations, (SELECT count(*)::int FROM rsvps) AS rsvps`,
    q<{ created_at: string; meta: { purged?: number; failed?: number } | null }>`SELECT created_at, meta FROM audit_log WHERE action = 'cron.purge' ORDER BY id DESC LIMIT 1`,
    q<{ n: number }>`SELECT count(*)::int AS n FROM invitations WHERE status = 'draft' AND published_at IS NULL AND updated_at < now() - interval '180 days'`,
    q<{ n: number }>`SELECT count(*)::int AS n FROM audit_log WHERE action LIKE 'error.%' AND created_at > now() - interval '24 hours'`,
  ]);
  const purge = lastPurge[0];
  const test = isTestPayments();

  const checks: { label: string; ok: boolean; hint: string; critical?: boolean }[] = [
    { label: "Paiement FlexPay", ok: !test && has("FLEXPAY_MERCHANT", "FLEXPAY_TOKEN", "FLEXPAY_CALLBACK_SECRET"), critical: true, hint: test ? "Mode test actif : aucun vrai paiement." : "Identifiants FlexPay et secret de callback." },
    { label: "E-mails (Resend)", ok: has("RESEND_API_KEY", "EMAIL_FROM"), hint: "Code de connexion par e-mail, reçus, mot de passe oublié, notifications de réponses et alertes de remboursement." },
    { label: "Connexion avec Google", ok: has("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"), hint: "Bouton « Continuer avec Google » sur les pages de connexion et d'inscription." },
    { label: "Notifications push", ok: has("VAPID_PRIVATE_KEY", "NEXT_PUBLIC_VAPID_PUBLIC_KEY"), hint: "Alertes sur le téléphone de l'organisateur." },
    { label: "Stockage des photos", ok: has("BLOB_READ_WRITE_TOKEN"), critical: true, hint: "Vercel Blob." },
    { label: "Anti-bot Turnstile", ok: has("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"), hint: "Protège inscription, connexion et réponses." },
    { label: "Nettoyage automatique", ok: has("CRON_SECRET"), critical: true, hint: "Suppression des invitations expirées." },
    { label: "Infos de l'entreprise", ok: has("NEXT_PUBLIC_COMPANY_NAME", "NEXT_PUBLIC_CONTACT_EMAIL"), hint: "Affichées dans les pages légales." },
  ];

  return (
    <>
      <PageTitle title="Système" hint="Configuration, nettoyage automatique, base de données et tarifs." />

      <div className="space-y-4">
        <Panel title="Configuration" hint="Seule la présence des réglages est affichée, jamais leur valeur.">
          <ul className="divide-y">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                {c.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <CircleAlert className={`mt-0.5 size-5 shrink-0 ${c.critical ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`} />}
                <div className="text-sm">
                  <p className="font-medium">{c.label} <span className="text-muted-foreground font-normal">· {c.ok ? "configuré" : "à configurer"}</span></p>
                  <p className="text-muted-foreground text-xs">{c.hint}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Nettoyage automatique" hint="Tous les jours à 02 h (heure de Kinshasa).">
            <p className="text-sm">
              {purge ? <>Dernière exécution : <strong>{fmtDateTime(purge.created_at)}</strong> — {purge.meta?.purged ?? 0} supprimée(s), {purge.meta?.failed ?? 0} échec(s).</> : <>Aucune exécution enregistrée pour l&apos;instant.</>}
            </p>
            <form action={purgeStaleDrafts} className="mt-4 border-t pt-4">
              <p className="text-muted-foreground mb-2 text-xs">Brouillons jamais publiés et inactifs depuis 180 jours : {stale[0]?.n ?? 0}.</p>
              <ConfirmButton message="Supprimer ces brouillons inactifs et leurs photos ?" variant="outline" size="sm" disabled={!stale[0]?.n}><Trash2 className="size-4" />Supprimer les brouillons inactifs</ConfirmButton>
            </form>
          </Panel>

          <Panel title="Base de données et erreurs">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground text-xs">Taille</dt><dd className="font-semibold">{db[0]?.size}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Erreurs (24 h)</dt><dd className={`font-semibold ${errors[0]?.n ? "text-destructive" : ""}`}>{errors[0]?.n ?? 0}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Taux USD → CDF</dt><dd className="font-semibold">{usdCdfRate()}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Paiements</dt><dd className="font-semibold">{test ? "Mode test" : "Réels"}</dd></div>
            </dl>
            <p className="text-muted-foreground mt-4 border-t pt-3 text-xs">
              Les sauvegardes et la restauration à un instant donné se gèrent dans la console Neon (historique de restauration).
            </p>
          </Panel>
        </div>

        <Panel title="Tarifs en vigueur" hint="Prix de base pour 50 invités, en dollars. Le supplément s'applique au-delà de 50 invités.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="py-2 pr-4 font-medium">Catégorie</th>
                  {TIERS.map((t) => <th key={t} className="px-2 py-2 text-right font-medium">{t.charAt(0).toUpperCase() + t.slice(1)}</th>)}
                  <th className="py-2 pl-2 text-right font-medium">Par invité en plus</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{c.label}</td>
                    {TIERS.map((t) => <td key={t} className="px-2 py-2 text-right tabular-nums">{formatUsdCents(c.prices[t])}</td>)}
                    <td className="py-2 pl-2 text-right tabular-nums">{formatUsdCents(c.extraGuestCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0"><a href="/admin/reglages">Modifier les tarifs</a></Button>
        </Panel>
      </div>
    </>
  );
}
