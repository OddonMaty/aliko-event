import type { Metadata } from "next";
import Link from "next/link";

import { ContactLine, LegalPage, LegalSection } from "@/components/legal-page";
import { COMPANY_ADDRESS, COMPANY_NAME } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <LegalPage
      current="/confidentialite"
      title="Confidentialité"
      intro="Nous collectons le minimum de données nécessaire pour faire fonctionner vos invitations. Nous ne vendons aucune donnée et nous n'affichons aucune publicité."
    >
      <LegalSection title="Qui est responsable de vos données">
        <p>
          {COMPANY_NAME}
          {COMPANY_ADDRESS ? `, ${COMPANY_ADDRESS},` : ""} est responsable du traitement des données collectées par Aliko Event. Pour les noms et les réponses de vos invités,
          l&apos;organisateur de l&apos;événement et Aliko Event en partagent la responsabilité : l&apos;organisateur décide quels invités il ajoute, nous hébergeons et protégeons ces données.
        </p>
      </LegalSection>

      <LegalSection title="Les données que nous collectons">
        <ul>
          <li>
            <strong>Votre compte :</strong> nom, e-mail, téléphone (facultatif) et mot de passe. Le mot de passe est enregistré sous forme chiffrée irréversible, jamais en clair.
          </li>
          <li>
            <strong>Vos commandes :</strong> formule, montant, devise, moyen de paiement, référence de commande et, pour Mobile Money, le numéro utilisé pour la demande de paiement. Nous ne
            voyons ni ne conservons les numéros de carte bancaire : la saisie se fait chez le prestataire de paiement.
          </li>
          <li>
            <strong>Votre invitation :</strong> textes, date, lieu, programme, photos, boissons proposées.
          </li>
          <li>
            <strong>Vos invités nommés :</strong> le nom que vous saisissez, un jeton personnel (qui compose son lien et son QR code) et l&apos;heure d&apos;entrée si vous scannez les pass.
          </li>
          <li>
            <strong>Les réponses d&apos;un invité :</strong> nom, présence, nombre de personnes, boisson choisie, téléphone et e-mail (facultatifs) et message privé aux hôtes.
          </li>
          <li>
            <strong>Les « mots doux » :</strong> le nom et le message qu&apos;un invité laisse sur l&apos;invitation.
          </li>
          <li>
            <strong>Données de sécurité :</strong> une empreinte chiffrée de l&apos;adresse IP (pas l&apos;adresse elle-même), utilisée pour limiter les abus et les fraudes, et un journal des actions sensibles
            (création d&apos;une commande, publication, signalement).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Pourquoi nous les utilisons">
        <ul>
          <li>Fournir le service que vous avez acheté : créer, publier et gérer votre invitation, recevoir les réponses.</li>
          <li>Traiter votre paiement et prévenir les fraudes.</li>
          <li>Protéger le service contre les abus : messages indésirables, usurpation, liens malveillants.</li>
          <li>Respecter nos obligations légales et comptables.</li>
        </ul>
        <p>Nous ne faisons ni profilage, ni publicité ciblée, et nous ne revendons aucune donnée.</p>
      </LegalSection>

      <LegalSection title="Qui peut voir quoi">
        <ul>
          <li>Les réponses de vos invités ne sont visibles que par vous.</li>
          <li>Les « mots doux » sont visibles par les personnes qui ont le lien de l&apos;invitation. Vous pouvez en masquer.</li>
          <li>Le lien d&apos;une invitation est impossible à deviner et n&apos;est pas référencé par les moteurs de recherche. Toute personne à qui vous le transmettez peut toutefois l&apos;ouvrir.</li>
          <li>Le lien personnel d&apos;un invité affiche son prénom. Ne le diffusez qu&apos;à cette personne.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Avec qui nous partageons des données">
        <p>Nous faisons appel à des prestataires techniques qui traitent des données pour notre compte :</p>
        <ul>
          <li>
            <strong>Vercel</strong> : hébergement du site et stockage des photos.
          </li>
          <li>
            <strong>Neon</strong> : base de données.
          </li>
          <li>
            <strong>FlexPay</strong> : paiement par Mobile Money et par carte.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> : vérification anti-robots sur les formulaires, lorsqu&apos;elle est activée.
          </li>
          <li>
            <strong>Google Maps</strong> : affichage de la carte du lieu, uniquement si l&apos;invité clique sur « Afficher la carte ».
          </li>
        </ul>
        <p>
          Ces prestataires peuvent héberger des données hors de la République démocratique du Congo, notamment en Europe et aux États-Unis. Nous ne leur transmettons que ce qui est nécessaire à leur mission.
        </p>
      </LegalSection>

      <LegalSection title="Combien de temps nous les gardons">
        <ul>
          <li>Votre compte : tant qu&apos;il est actif, ou jusqu&apos;à votre demande de suppression.</li>
          <li>Vos commandes : pendant la durée exigée par nos obligations comptables.</li>
          <li>Votre invitation, vos invités et leurs réponses : l&apos;invitation est accessible jusqu&apos;à 30 jours après l&apos;événement. Ces données sont ensuite supprimées ou rendues anonymes, au plus tard 12 mois après la date de l&apos;événement, et plus tôt sur simple demande.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous pouvez demander à accéder à vos données, les corriger, les supprimer, vous opposer à leur usage ou en obtenir une copie. Si vous êtes invité et que vous souhaitez effacer votre réponse
          ou votre nom, écrivez-nous ou contactez l&apos;organisateur. Pour exercer ces droits, indiquez l&apos;e-mail de votre compte ou le lien de l&apos;invitation concernée.
        </p>
        <ContactLine />
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les échanges sont chiffrés (HTTPS). Les mots de passe sont chiffrés de façon irréversible. Les liens d&apos;invitation et de pass sont générés au hasard. Les envois de formulaires sont limités
          pour bloquer les abus, et les photos sont vérifiées avant d&apos;être acceptées. Aucun système n&apos;est infaillible : si une faille touchait vos données, nous vous le dirions.
        </p>
      </LegalSection>

      <LegalSection title="Mineurs">
        <p>Aliko Event s&apos;adresse aux adultes. Nous ne collectons pas sciemment de données sur des personnes de moins de 18 ans qui créeraient un compte seules.</p>
      </LegalSection>

      <LegalSection title="Cookies et changements">
        <p>
          Les cookies sont décrits sur la <Link href="/cookies" className="text-primary underline-offset-4 hover:underline">page cookies</Link>. Si nous modifions cette politique, la date en haut de page change.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
