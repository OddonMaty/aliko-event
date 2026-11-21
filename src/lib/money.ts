export type Currency = "USD" | "CDF";

export function usdCdfRate(): number {
  const r = Number(process.env.USD_CDF_RATE ?? "2800");
  return Number.isFinite(r) && r > 0 ? r : 2800;
}

/**
 * Montant dans la plus petite unité stockée en base :
 * USD → cents ; CDF → francs congolais (arrondi à la centaine supérieure).
 */
export function toMinorAmount(usdCents: number, currency: Currency): number {
  if (currency === "USD") return usdCents;
  const cdf = (usdCents / 100) * usdCdfRate();
  return Math.ceil(cdf / 100) * 100;
}

/** Montant tel qu'envoyé à FlexPay (USD en dollars, CDF en francs). */
export function flexpayAmount(minor: number, currency: Currency): number {
  return currency === "USD" ? Number((minor / 100).toFixed(2)) : minor;
}

export function formatMoney(minor: number, currency: Currency): string {
  if (currency === "USD") {
    const dollars = minor / 100;
    return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
  }
  return `${new Intl.NumberFormat("fr-FR").format(minor)} FC`;
}

export function formatUsdCents(cents: number): string {
  return formatMoney(cents, "USD");
}
