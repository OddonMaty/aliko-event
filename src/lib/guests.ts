import { randomBytes } from "node:crypto";

import { q } from "./db";

// Jeton personnel d'un invité : 96 bits aléatoires, impossible à deviner.
export const newGuestToken = () => randomBytes(12).toString("base64url");
export const isGuestToken = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{16}$/.test(v);

export interface GuestLookup {
  id: string;
  name: string;
  partyType: "single" | "couple";
}

export async function findGuest(invitationId: string, token: unknown): Promise<GuestLookup | null> {
  if (!isGuestToken(token)) return null;
  const rows = await q<GuestLookup>`SELECT id, name, party_type AS "partyType" FROM guests WHERE token = ${token} AND invitation_id = ${invitationId}`;
  return rows[0] ?? null;
}
