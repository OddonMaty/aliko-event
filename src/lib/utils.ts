import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate une date ISO (YYYY-MM-DD) en français, sans décalage de fuseau. */
export function formatDateFr(iso: string | null | undefined, style: "full" | "long" = "full") {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: style, timeZone: "UTC" }).format(d);
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
