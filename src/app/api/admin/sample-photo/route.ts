import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";

import { requireApiUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { SAMPLE_THEMES } from "@/lib/samples";
import { assertSameOrigin, audit, HttpError, rateLimit } from "@/lib/security";
import { getSettings, saveSettings } from "@/lib/settings";

const MAX_BYTES = 4 * 1024 * 1024; // limite d'envoi de la plateforme (≈ 4,5 Mo)

function detectType(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

async function adminOnly() {
  const user = await requireApiUser();
  if (user.role !== "admin") throw new HttpError(403, "Réservé à l'administrateur");
  return user;
}

const removeBlob = (url: string | undefined) => (url ? del(url).catch(() => undefined) : Promise.resolve());

/** Remplace la photo d'exemple d'un thème. */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new HttpError(503, "Stockage des photos non configuré");
  const admin = await adminOnly();
  await rateLimit(`sample-photo:${admin.id}`, 60, 3600);

  const form = await req.formData();
  const theme = String(form.get("theme") ?? "");
  const file = form.get("file");
  if (!SAMPLE_THEMES.includes(theme)) throw new HttpError(400, "Thème inconnu");
  if (!(file instanceof File)) throw new HttpError(400, "Fichier manquant");
  if (file.size === 0 || file.size > MAX_BYTES) throw new HttpError(400, "Image trop lourde (4 Mo maximum)");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectType(bytes);
  if (!type) throw new HttpError(400, "Format non supporté (JPEG, PNG ou WebP)");

  const blob = await put(`samples/${theme}/${randomUUID()}.${type.ext}`, Buffer.from(bytes), { access: "public", contentType: type.mime, addRandomSuffix: false });
  const current = await getSettings();
  const previous = current.samples[theme];
  await saveSettings({ ...current, samples: { ...current.samples, [theme]: blob.url } }, admin.id);
  await removeBlob(previous);
  await audit(admin.id, "admin.sample_photo.set", "settings", theme);
  return json({ ok: true, url: blob.url });
});

/** Revient à la photo par défaut d'un thème. */
export const DELETE = handle(async (req) => {
  assertSameOrigin(req);
  const admin = await adminOnly();
  const theme = new URL(req.url).searchParams.get("theme") ?? "";
  if (!SAMPLE_THEMES.includes(theme)) throw new HttpError(400, "Thème inconnu");
  const current = await getSettings();
  const previous = current.samples[theme];
  const { [theme]: _removed, ...rest } = current.samples;
  void _removed;
  await saveSettings({ ...current, samples: rest }, admin.id);
  await removeBlob(previous);
  await audit(admin.id, "admin.sample_photo.reset", "settings", theme);
  return json({ ok: true });
});
