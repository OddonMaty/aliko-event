import { del, list } from "@vercel/blob";
import { timingSafeEqual } from "node:crypto";

import { q } from "@/lib/db";
import { audit } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 100;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = req.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Supprime les photos stockées pour une invitation (dossier inv/<id>/). */
async function deletePhotos(invitationId: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `inv/${invitationId}/`, cursor, limit: 100 });
    if (page.blobs.length) await del(page.blobs.map((b) => b.url));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}

/**
 * Tâche quotidienne (Vercel Cron) : supprime les invitations dont la date d'expiration est passée,
 * avec leurs invités, réponses, mots doux, signalements et photos. Les commandes sont conservées
 * (obligations comptables).
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) return Response.json({ error: "CRON_SECRET manquant" }, { status: 503 });
  if (!authorized(req)) return Response.json({ error: "Non autorisé" }, { status: 401 });

  const expired = await q<{ id: string; user_id: string }>`
    SELECT id, user_id FROM invitations
    WHERE expires_at IS NOT NULL AND expires_at < now()
    ORDER BY expires_at ASC LIMIT ${BATCH}`;

  const done: string[] = [];
  const failed: string[] = [];
  for (const inv of expired) {
    try {
      // Les photos d'abord : si leur suppression échoue, on garde l'invitation et on réessaie demain.
      await deletePhotos(inv.id);
      await q`DELETE FROM invitations WHERE id = ${inv.id}`;
      await audit(inv.user_id, "invitation.purged", "invitation", inv.id);
      done.push(inv.id);
    } catch (e) {
      console.error("[purge]", inv.id, e);
      failed.push(inv.id);
    }
  }

  // Compteurs anti-abus périmés.
  await q`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`.catch(() => undefined);

  return Response.json({ purged: done.length, failed: failed.length, remaining: expired.length === BATCH });
}
