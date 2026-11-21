# Aliko Event

Boutique d'invitations numériques (RDC) : on choisit un événement, on choisit un design, on l'achète (paiement unique, sans abonnement), on le personnalise, puis on partage un **lien** et un **QR code** aux invités. Les invités confirment leur présence (RSVP).

**Stack** : Next.js 15 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Neon (PostgreSQL) · FlexPay (Mobile Money + carte) · Vercel Blob (photos).
**Thème** : or & noir (sombre par défaut) + mode clair.

> ⚠️ Ce code a été écrit sans pouvoir exécuter `npm install` (réseau désactivé dans l'environnement de création) : il n'a donc **pas encore été compilé ni testé**. Voir « Premier lancement » ci-dessous.

## Premier lancement

```bash
npm install
cp .env.example .env.local     # puis remplir les variables
npm run typecheck              # corrige les éventuelles erreurs de types
npm run dev
```

### Variables d'environnement (`.env.local`)

| Variable | Où la trouver |
|---|---|
| `DATABASE_URL` | Console Neon → projet **aliko-event** → *Connect* (chaîne « pooled ») |
| `SESSION_SECRET` | `openssl rand -base64 48` |
| `FLEXPAY_MERCHANT`, `FLEXPAY_TOKEN` | Votre compte marchand FlexPay |
| `FLEXPAY_CALLBACK_SECRET` | `openssl rand -hex 24` (vous l'inventez) |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob |
| `USD_CDF_RATE` | Taux du jour (1 USD = X CDF), à mettre à jour régulièrement |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (gratuit, recommandé) |
| `NEXT_PUBLIC_APP_URL` | URL publique du site (ex. `https://aliko.events`) |

### Base de données

Le projet Neon **aliko-event** existe déjà et le schéma de `db/schema.sql` y est appliqué (tables : `users`, `orders`, `payment_events`, `invitations`, `rsvps`, `abuse_reports`, `rate_limits`, `audit_log`).

Premier administrateur (après votre inscription sur le site) :

```sql
UPDATE users SET role = 'admin' WHERE lower(email) = 'votre@email.com';
```

Page d'administration : `/admin` (signalements, suspension, alertes de paiement).

## FlexPay — à vérifier avec votre compte

Le client FlexPay (`src/lib/flexpay.ts`) suit la documentation publique et les clients communautaires. **Confirmez avec la documentation de votre compte marchand** :

1. les URL (`FLEXPAY_API_BASE`, `FLEXPAY_CARD_URL`, `FLEXPAY_CHECK_BASE`) ;
2. les noms de champs (`callbackUrl` pour le mobile ; `callback_url`, `approve_url`, `cancel_url`, `decline_url` pour la carte) ;
3. la structure de la réponse de vérification (`transaction.status` : 0 = réussi, 1 = échoué) ;
4. l'URL de callback à déclarer : `https://VOTRE-DOMAINE/api/flexpay/callback?t=<FLEXPAY_CALLBACK_SECRET>` (elle est aussi envoyée à chaque demande).

Test recommandé en mode sandbox/montant minimal avant toute mise en ligne.

## Anti-fraude (déjà en place)

- **Paiement** : le prix est calculé côté serveur ; une commande ne passe à « payée » que si FlexPay confirme (API de vérification) avec le bon montant, la bonne devise et la bonne référence. Callback protégé par secret + journal idempotent. Un client ne peut jamais modifier lui-même le statut d'un paiement.
- **Liens** : identifiants aléatoires cryptographiques (14 caractères), pages `noindex`, aucune liste publique.
- **Contenu** : validation stricte (Zod) ; pas de HTML libre ; liens limités aux cartes (Google Maps, OpenStreetMap, Waze) ; photos hébergées chez nous uniquement et rattachées à l'invitation.
- **Abus** : limitation de débit en base (connexion, inscription, RSVP, paiement, upload, signalement), Cloudflare Turnstile, bouton « Signaler », suspension par un administrateur.
- **Données** : les réponses des invités ne sont lisibles que par le propriétaire ; IP hachées ; export CSV protégé contre l'injection de formules ; invitation retirée 30 jours après l'événement.
- **Web** : CSRF (contrôle d'origine), cookies `httpOnly`/`SameSite`, en-têtes de sécurité et CSP en production.

## Structure

```
db/schema.sql                    schéma PostgreSQL (déjà appliqué sur Neon)
src/lib/catalog.ts               catégories, formules (Essentiel/Standard/Premium), prix en USD
src/lib/templates.ts             les 10 designs (mise en page + palette + polices)
src/components/invitation/       rendu des invitations (5 mises en page)
src/components/ui/               composants shadcn/ui
src/app/modeles                  galerie + page de design + achat
src/app/acheter                  paiement (Mobile Money / carte) et suivi
src/app/tableau-de-bord          mes invitations + éditeur (contenu, photos, partage/QR, réponses)
src/app/i/[slug]                 page publique de l'invitation + RSVP
src/app/api/*                    auth, checkout, callback FlexPay, upload, RSVP, QR, export, signalement
```

### Ajouter un design

Ajoutez un objet dans `TEMPLATES` (`src/lib/templates.ts`) : choisissez une mise en page (`classic`, `frame`, `arch`, `minimal`, `split`), une palette et des polices. Il apparaît automatiquement dans la galerie.

### Modifier les prix

`src/lib/catalog.ts` (prix en cents USD, par catégorie et par formule). Le prix en CDF est calculé avec `USD_CDF_RATE`.

## Déploiement (Vercel)

1. Importer le dépôt sur Vercel, ajouter toutes les variables d'environnement.
2. Créer un store **Blob** et copier `BLOB_READ_WRITE_TOKEN`.
3. Renseigner le domaine dans `NEXT_PUBLIC_APP_URL` et déclarer l'URL de callback chez FlexPay.

## Feuille de route

- **Phase 2** : QR code et lien personnels par invité, scanner d'entrée le jour J, import de contacts, musique.
- **Phase 3** : espace designers, modération d'images, envoi WhatsApp/SMS, multilingue (FR/EN/Lingala/Swahili), pages légales (CGU, confidentialité, remboursement).
