import type { Metadata } from "next";

import { ContactLine, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <LegalPage
      current="/cookies"
      title="Cookies"
      intro="Aliko Event n'utilise ni cookie publicitaire ni outil de mesure d'audience. Voici ce qui est stocké sur votre appareil, et pourquoi."
    >
      <LegalSection title="Ce que nous stockons">
        <ul>
          <li>
            <strong>Cookie de connexion (aliko_session).</strong> Il vous garde connecté à votre compte. Il est réservé à Aliko Event, invisible pour les scripts du navigateur, et dure 30 jours. Sans lui, vous ne
            pouvez pas vous connecter. Il ne demande pas votre accord car il est indispensable au service.
          </li>
          <li>
            <strong>Préférence d&apos;affichage (theme).</strong> Elle retient votre choix entre le mode sombre et le mode clair. Elle reste sur votre appareil.
          </li>
          <li>
            <strong>Avis cookies (aliko-cookie-notice).</strong> Elle retient que vous avez lu l&apos;information sur les cookies, pour ne pas vous la montrer à chaque visite.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Ce qui vient de services tiers">
        <ul>
          <li>
            <strong>Cloudflare Turnstile.</strong> Sur les formulaires protégés (inscription, connexion, confirmation de présence), un contrôle anti-robots peut s&apos;exécuter et déposer des données techniques,
            selon la politique de Cloudflare.
          </li>
          <li>
            <strong>Google Maps.</strong> La carte du lieu n&apos;est chargée que si vous cliquez sur « Afficher la carte ». Google peut alors déposer ses propres cookies, selon sa politique. Si vous ne cliquez pas, rien n&apos;est
            envoyé à Google.
          </li>
          <li>
            <strong>FlexPay.</strong> Lors d&apos;un paiement par carte, vous quittez Aliko Event pour la page sécurisée du prestataire, qui applique ses propres règles.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Ce que nous n'utilisons pas">
        <p>Aucun cookie de publicité, aucun suivi entre sites, aucun outil de statistiques de visite.</p>
      </LegalSection>

      <LegalSection title="Les gérer">
        <p>
          Vous pouvez supprimer ou bloquer les cookies dans les réglages de votre navigateur. Bloquer le cookie de connexion vous empêchera d&apos;accéder à votre compte ; les invités, eux, peuvent
          consulter une invitation et répondre sans aucun cookie de notre part.
        </p>
        <ContactLine />
      </LegalSection>
    </LegalPage>
  );
}
