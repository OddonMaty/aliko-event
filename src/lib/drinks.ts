// Boissons proposées à l'organisateur (il coche celles qu'il sert, et peut en ajouter).
export const DRINK_PRESETS = [
  "Eau minérale",
  "Jus de fruits",
  "Jus de bissap",
  "Jus de gingembre",
  "Soda",
  "Limonade",
  "Thé",
  "Café",
  "Bière locale",
  "Bière importée",
  "Vin rouge",
  "Vin blanc",
  "Champagne",
  "Whisky",
  "Cocktail sans alcool",
  "Cocktail",
] as const;

export const DEFAULT_DRINKS = ["Eau minérale", "Jus de fruits", "Soda", "Bière locale", "Vin rouge"];
export const MAX_DRINKS = 20;
