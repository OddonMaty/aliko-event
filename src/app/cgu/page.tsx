import type { Metadata } from "next";
import Link from "next/link";

import { ContactLine, LegalPage, LegalSection } from "@/components/legal-page";
import { COMPANY_ADDRESS, COMPANY_NAME } from "@/lib/legal";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <LegalPage
      current="/cgu"
      title="Conditions d'utilisation"
      intro="Ces conditions expliquent ce que vous pouvez faire avec Aliko Event, ce que nous faisons de notre côté, et ce que nous attendons de vous. En créant un compte ou en achetant une invitation, vous les acceptez."
    >
      <LegalSection title="1. Le service">
        <p>
          Aliko Event, édité par {COMPANY_NAME}
          {COMPANY_ADDRESS ? ` (${COMPANY_ADDRESS})` : ""}, permet de créer, personnaliser et partager des invitations numériques pour des événements : mariage, dot, anniversaire,
          baby shower, baptême, remise de diplôme, conférence, réunion et autres. Chaque invitation dispose d&apos;un lien, d&apos;un QR code, d&apos;une confirmation de présence en
          ligne et, selon la formule, d&apos;un programme, d&apos;un choix de boissons, d&apos;une carte du lieu et d&apos;un pass personnel par invité.
        </p>
        <p>
          « Organisateur » désigne la personne qui achète et gère une invitation. « Invité » désigne toute personne qui reçoit le lien d&apos;une invitation.
        </p>
      </LegalSection>

      <LegalSection title="2. Votre compte">
        <ul>
          <li>Vous devez avoir 18 ans révolus, ou l&apos;accord d&apos;un représentant légal.</li>
          <li>Les informations que vous donnez (nom, e-mail, téléphone) doivent être exactes.</li>
          <li>Votre compte est personnel. Gardez votre mot de passe secret : vous êtes responsable de ce qui est fait depuis votre compte.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Prix et paiement">
        <p>
          Vous payez une seule fois, par invitation. Il n&apos;y a pas d&apos;abonnement. Le prix dépend du type d&apos;événement, de la formule (Essentiel, Standard ou Premium) et du
          nombre d&apos;invités choisi. Il est affiché avant le paiement, en dollars américains (USD) ou en francs congolais (CDF) au taux indiqué au moment de l&apos;achat.
        </p>
        <p>
          Le paiement se fait par Mobile Money ou par carte bancaire, via notre prestataire FlexPay. Votre invitation est activée uniquement après confirmation du paiement par le
          prestataire. Le prix est toujours calculé par nos serveurs : il ne peut pas être modifié depuis votre navigateur.
        </p>
      </LegalSection>

      <LegalSection title="4. Durée et limites">
        <ul>
          <li>Votre invitation reste en ligne jusqu&apos;à la fin du lendemain de la date de l&apos;événement (minuit, heure de Kinshasa). Elle est ensuite supprimée automatiquement, avec ses invités, leurs réponses, les mots doux et les photos. Téléchargez la liste de vos invités avant cette date si vous voulez la garder.</li>
          <li>Vous pouvez modifier votre invitation autant que vous le souhaitez pendant cette période. Le lien ne change pas.</li>
          <li>Le nombre d&apos;invités, de photos et d&apos;étapes de programme est limité selon votre achat. Au-delà, l&apos;ajout est refusé.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Ce que vous publiez">
        <p>Vous restez propriétaire de vos textes et de vos photos, et vous nous autorisez à les héberger et à les afficher aux personnes qui ont votre lien, uniquement pour fournir le service.</p>
        <p>Vous garantissez avoir le droit d&apos;utiliser les photos et les informations que vous publiez, et d&apos;enregistrer les noms de vos invités. Il est interdit de publier :</p>
        <ul>
          <li>un contenu illégal, haineux, discriminatoire, violent ou à caractère sexuel ;</li>
          <li>un message destiné à tromper : escroquerie, hameçonnage, fausse demande d&apos;argent, usurpation d&apos;identité ;</li>
          <li>un contenu qui porte atteinte aux droits d&apos;un tiers (image, nom, droit d&apos;auteur, vie privée) ;</li>
          <li>un lien ou un message destiné à promouvoir autre chose que votre événement.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Signalement et suspension">
        <p>
          Chaque invitation comporte un bouton pour signaler un abus. Nous pouvons suspendre sans préavis une invitation qui enfreint ces conditions ou qui présente un risque de fraude, le
          temps de vérifier. Une invitation suspendue pour violation de ces conditions n&apos;est pas remboursée.
        </p>
      </LegalSection>

      <LegalSection title="7. Propriété intellectuelle">
        <p>
          Les designs, illustrations, textes d&apos;exemple, le code et la marque Aliko Event appartiennent à {COMPANY_NAME}. En achetant une invitation, vous recevez le droit
          personnel, non exclusif et non transférable de l&apos;utiliser pour votre événement. Vous ne pouvez pas revendre ou redistribuer nos designs.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilité et responsabilité">
        <p>
          Nous faisons le maximum pour que le service soit disponible, mais nous ne pouvons pas garantir qu&apos;il fonctionne sans interruption (maintenance, panne d&apos;un prestataire,
          réseau mobile). Vérifiez toujours la date, l&apos;heure et le lieu de votre invitation avant de la partager : vous êtes responsable de l&apos;exactitude de ces informations.
        </p>
        <p>
          Nous ne sommes pas responsables de l&apos;organisation de votre événement, ni des dommages indirects (événement manqué, perte de revenus). Dans tous les cas, notre responsabilité
          est limitée au montant que vous avez payé pour l&apos;invitation concernée, sauf faute intentionnelle ou lourde de notre part.
        </p>
      </LegalSection>

      <LegalSection title="9. Remboursement, données et cookies">
        <p>
          Les cas de remboursement sont décrits dans la <Link href="/remboursement" className="text-primary underline-offset-4 hover:underline">politique de remboursement</Link>. L&apos;usage
          de vos données est expliqué dans la <Link href="/confidentialite" className="text-primary underline-offset-4 hover:underline">politique de confidentialité</Link> et la{" "}
          <Link href="/cookies" className="text-primary underline-offset-4 hover:underline">page cookies</Link>.
        </p>
      </LegalSection>

      <LegalSection title="10. Modifications et droit applicable">
        <p>
          Nous pouvons modifier ces conditions. La date de mise à jour figure en haut de cette page. Pour une invitation déjà achetée, les conditions en vigueur au moment de l&apos;achat
          continuent de s&apos;appliquer.
        </p>
        <p>Ces conditions sont régies par le droit de la République démocratique du Congo. En cas de litige, nous cherchons d&apos;abord une solution à l&apos;amiable avec vous.</p>
        <ContactLine />
      </LegalSection>
    </LegalPage>
  );
}
