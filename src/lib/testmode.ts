// Mode « paiement simulé » : uniquement si PAYMENT_MODE=test est défini côté serveur.
// Aucun argent réel n'est échangé ; à désactiver (retirer la variable) avant la mise en vente.
export function isTestPayments(): boolean {
  return process.env.PAYMENT_MODE === "test";
}
