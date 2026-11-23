import type { Metadata } from "next";

import { ContactLine, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Politique de remboursement" };

export default function RefundPage() {
  return (
    <LegalPage
      current="/remboursement"
      title="Remboursement"
      intro="Une invitation numérique est livrée tout de suite après le paiement. Voici dans quels cas nous vous remboursons, et comment en faire la demande."
    >
      <LegalSection title="Quand nous remboursons">
        <p>Vous êtes remboursé intégralement dans les cas suivants :</p>
        <ul>
          <li>
            <strong>Paiement sans activation.</strong> Votre paiement a été prélevé mais votre invitation n&apos;a pas été activée, et nous ne pouvons pas régler le problème sous 48 heures.
          </li>
          <li>
            <strong>Double paiement.</strong> Vous avez payé deux fois la même commande.
          </li>
          <li>
            <strong>Changement d&apos;avis rapide.</strong> Vous demandez le remboursement dans les 7 jours suivant l&apos;achat, et votre invitation n&apos;a pas encore été publiée.
          </li>
          <li>
            <strong>Service non conforme.</strong> Le service ne fonctionne pas comme décrit au moment de l&apos;achat, et nous ne parvenons pas à le corriger.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Quand nous ne remboursons pas">
        <ul>
          <li>Une fois l&apos;invitation publiée, sauf paiement sans activation, double paiement ou service non conforme.</li>
          <li>Si l&apos;invitation a été suspendue parce qu&apos;elle enfreint les conditions d&apos;utilisation.</li>
          <li>Si vous avez saisi une mauvaise information (date, lieu, nom). Vous pouvez la corriger gratuitement, autant de fois que nécessaire.</li>
        </ul>
        <p>
          Si votre événement est reporté ou déplacé, modifiez la date et le lieu dans votre invitation : le même lien reste valable et la durée de mise en ligne suit la nouvelle date.
        </p>
      </LegalSection>

      <LegalSection title="Comment demander un remboursement">
        <p>Envoyez-nous un message avec :</p>
        <ul>
          <li>la référence de votre commande (elle commence par AE-) ;</li>
          <li>le nom et l&apos;e-mail de votre compte ;</li>
          <li>le motif de votre demande.</li>
        </ul>
        <p>Nous répondons sous 5 jours ouvrés.</p>
        <ContactLine />
      </LegalSection>

      <LegalSection title="Comment vous êtes remboursé">
        <ul>
          <li>Le remboursement se fait par le même moyen que le paiement : le même numéro Mobile Money, ou la même carte bancaire.</li>
          <li>Il est effectué dans la devise que vous avez payée.</li>
          <li>Le délai de réception dépend de votre opérateur ou de votre banque, en général entre 7 et 14 jours après notre accord.</li>
          <li>Après un remboursement, l&apos;invitation concernée est désactivée.</li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
