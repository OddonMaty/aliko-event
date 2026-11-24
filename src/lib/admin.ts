import { notFound } from "next/navigation";

import { getCurrentUser, type SessionUser } from "@/lib/auth";

/** Réservé aux administrateurs ; renvoie une 404 aux autres (on ne révèle pas l'existence de la page). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser().catch(() => null);
  if (!user || user.role !== "admin") notFound();
  return user;
}

const TZ = "Africa/Kinshasa";
export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(new Date(d)) : "—";
export const fmtDateTime = (d: Date | string | null | undefined) =>
  d
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(d))
    : "—";

export const PAGE_SIZE = 25;

export function pageOf(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 && n < 10000 ? n : 1;
}

/** Texte de recherche nettoyé, prêt pour ILIKE (les jokers de l'utilisateur sont neutralisés). */
export function likeOf(raw: string | undefined): string {
  const s = (raw ?? "").trim().slice(0, 60).replace(/[\\%_]/g, (c) => `\\${c}`);
  return s ? `%${s}%` : "";
}
