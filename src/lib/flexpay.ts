import type { Currency } from "./money";

// Client FlexPay (agrégateur Mobile Money / carte, RDC).
// ⚠ Les formats ci-dessous suivent la documentation publique et les clients communautaires.
//   Vérifiez-les avec la documentation fournie avec votre compte marchand (URL, noms de champs).
//   Les URL sont configurables par variables d'environnement.

const API = (process.env.FLEXPAY_API_BASE ?? "https://backend.flexpay.cd/api/rest/v1").replace(/\/$/, "");
const CARD_URL = process.env.FLEXPAY_CARD_URL ?? "https://cardpayment.flexpay.cd/v1.1/pay";
const CHECK = (process.env.FLEXPAY_CHECK_BASE ?? `${API}/check`).replace(/\/$/, "");

function creds() {
  const merchant = process.env.FLEXPAY_MERCHANT;
  const token = process.env.FLEXPAY_TOKEN;
  if (!merchant || !token) throw new Error("FLEXPAY_MERCHANT / FLEXPAY_TOKEN manquants");
  return { merchant, token };
}

const bearer = (token: string) => (token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`);

export class FlexpayError extends Error {}

async function post(url: string, body: unknown, token: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: bearer(token) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new FlexpayError(`Réponse FlexPay illisible (HTTP ${res.status})`);
  }
}

const isOk = (code: unknown) => String(code) === "0";

export interface MobilePaymentInput {
  reference: string;
  phone: string; // 12 chiffres, ex. 243990000000
  amount: number;
  currency: Currency;
  callbackUrl: string;
}

/** Demande de paiement Mobile Money : l'opérateur envoie une demande de confirmation au téléphone du client. */
export async function requestMobilePayment(input: MobilePaymentInput): Promise<{ orderNumber: string }> {
  const { merchant, token } = creds();
  const data = await post(
    `${API}/paymentService`,
    {
      merchant,
      type: 1,
      phone: input.phone,
      reference: input.reference,
      amount: String(input.amount),
      currency: input.currency,
      callbackUrl: input.callbackUrl,
    },
    token,
  );
  if (!isOk(data.code) || !data.orderNumber) {
    throw new FlexpayError(String(data.message ?? "Paiement refusé par FlexPay"));
  }
  return { orderNumber: String(data.orderNumber) };
}

export interface CardPaymentInput {
  reference: string;
  amount: number;
  currency: Currency;
  description: string;
  callbackUrl: string;
  approveUrl: string;
  cancelUrl: string;
  declineUrl: string;
}

/** Paiement par carte : renvoie l'URL de la page de paiement sécurisée FlexPay. */
export async function requestCardPayment(input: CardPaymentInput): Promise<{ url: string; orderNumber?: string }> {
  const { merchant, token } = creds();
  const data = await post(
    CARD_URL,
    {
      authorization: bearer(token),
      merchant,
      reference: input.reference,
      amount: String(input.amount),
      currency: input.currency,
      description: input.description,
      callback_url: input.callbackUrl,
      approve_url: input.approveUrl,
      cancel_url: input.cancelUrl,
      decline_url: input.declineUrl,
    },
    token,
  );
  const url = typeof data.url === "string" ? data.url : "";
  if (!isOk(data.code) || !url.startsWith("https://")) {
    throw new FlexpayError(String(data.message ?? "Paiement par carte indisponible"));
  }
  return { url, orderNumber: data.orderNumber ? String(data.orderNumber) : undefined };
}

export interface FlexpayTransaction {
  status: number; // 0 = réussi, 1 = échoué (autres valeurs : en cours / inconnu)
  reference?: string;
  orderNumber?: string;
  amount?: number;
  currency?: string;
}

/** Interroge FlexPay directement : source de vérité (on ne se fie jamais au seul callback). */
export async function checkTransaction(orderNumber: string): Promise<FlexpayTransaction | null> {
  const { token } = creds();
  const res = await fetch(`${CHECK}/${encodeURIComponent(orderNumber)}`, {
    headers: { Accept: "application/json", Authorization: bearer(token) },
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data) return null;
  const tx = (data.transaction ?? data.Transaction) as Record<string, unknown> | undefined;
  if (!tx) return null;
  const num = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : Number(v));
  return {
    status: Number(tx.status),
    reference: tx.reference ? String(tx.reference) : undefined,
    orderNumber: tx.orderNumber ? String(tx.orderNumber) : undefined,
    amount: num(tx.amount),
    currency: tx.currency ? String(tx.currency) : undefined,
  };
}

/** Numéro RDC → 12 chiffres (243XXXXXXXXX). Retourne null si invalide. */
export function normalizeDrcPhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = "243" + d.slice(1);
  else if (d.length === 9) d = "243" + d;
  return /^243\d{9}$/.test(d) ? d : null;
}
