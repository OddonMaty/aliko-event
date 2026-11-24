import { del, list } from "@vercel/blob";

/** Supprime les photos stockées pour une invitation (dossier inv/<id>/). */
export async function deletePhotos(invitationId: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `inv/${invitationId}/`, cursor, limit: 100 });
    if (page.blobs.length) await del(page.blobs.map((b) => b.url));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
