// Informations légales affichées sur les pages CGU, confidentialité, remboursement et cookies.
// À renseigner dans les variables d'environnement Vercel (sans toucher au code) :
//   NEXT_PUBLIC_COMPANY_NAME  : raison sociale (ex. « Sao Tech Agency »)
//   NEXT_PUBLIC_CONTACT_EMAIL : adresse de contact pour le support et les demandes de données
//   NEXT_PUBLIC_COMPANY_ADDRESS : adresse postale (optionnelle)
export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Aliko Event";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
export const COMPANY_ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "";

/** Date de dernière mise à jour des textes légaux. */
export const LEGAL_UPDATED = "23 novembre 2026";

export const LEGAL_LINKS = [
  { href: "/cgu", label: "Conditions d'utilisation" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/remboursement", label: "Remboursement" },
  { href: "/cookies", label: "Cookies" },
] as const;
