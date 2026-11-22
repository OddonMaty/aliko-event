import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

import { requireApiUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { getOwnedInvitation } from "@/lib/invitations";
import { assertSameOrigin, HttpError, rateLimit } from "@/lib/security";

const MAX_BYTES = 4 * 1024 * 1024; // le navigateur compresse avant l'envoi (≈ 1 Mo)

function detectType(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new HttpError(503, "Stockage des photos non configuré (BLOB_READ_WRITE_TOKEN manquant)");
  }
  const user = await requireApiUser();
  await rateLimit(`upload:${user.id}`, 40, 3600);

  const form = await req.formData();
  const file = form.get("file");
  const invitationId = String(form.get("invitationId") ?? "");
  if (!(file instanceof File)) throw new HttpError(400, "Fichier manquant");
  if (file.size === 0 || file.size > MAX_BYTES) throw new HttpError(400, "Image trop lourde (4 Mo maximum)");

  const inv = await getOwnedInvitation(invitationId, user.id);
  if (inv.status !== "draft" && inv.status !== "published") throw new HttpError(403, "Téléversement impossible");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectType(bytes); // on ne se fie pas au type annoncé par le navigateur
  if (!type) throw new HttpError(400, "Format non supporté (JPEG, PNG ou WebP)");

  const blob = await put(`inv/${inv.id}/${randomUUID()}.${type.ext}`, Buffer.from(bytes), {
    access: "public",
    contentType: type.mime,
    addRandomSuffix: false,
  });
  return json({ url: blob.url });
});
