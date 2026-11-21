import { z } from "zod";

import { requireApiUser } from "@/lib/auth";
import { TIER_INFO } from "@/lib/catalog";
import { contentSchema, customSlugSchema, enforceTierLimits } from "@/lib/content";
import { q } from "@/lib/db";
import { handle, json, readJson } from "@/lib/http";
import { expiryFromEventDate, getOwnedInvitation } from "@/lib/invitations";
import { assertSameOrigin, audit, HttpError, rateLimit } from "@/lib/security";

const body = z.object({ content: z.unknown(), slug: z.string().optional() });

export const PUT = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`inv-save:${user.id}`, 120, 600);
  const { id } = (await ctx.params) as { id: string };

  const inv = await getOwnedInvitation(id, user.id);
  if (inv.status !== "draft" && inv.status !== "published") {
    throw new HttpError(403, inv.status === "awaiting_payment" ? "Paiement requis avant modification" : "Cette invitation ne peut pas être modifiée");
  }

  const parsed = body.parse(await readJson(req));
  const content = contentSchema.parse(parsed.content);
  try {
    enforceTierLimits(content, inv.tier);
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : "Limites du palier dépassées");
  }

  // Les photos doivent avoir été téléversées pour CETTE invitation.
  for (const url of content.photos) {
    if (!new URL(url).pathname.startsWith(`/inv/${inv.id}/`)) throw new HttpError(400, "Photo non autorisée");
  }

  let slug = inv.slug;
  if (parsed.slug && parsed.slug !== inv.slug) {
    if (!TIER_INFO[inv.tier].customSlug) throw new HttpError(403, "Le lien personnalisé est réservé au palier Premium");
    slug = customSlugSchema.parse(parsed.slug);
  }

  const expires = inv.status === "published" ? expiryFromEventDate(content.date) : null;
  try {
    await q`
      UPDATE invitations SET
        content = ${JSON.stringify(content)}::jsonb,
        event_date = NULLIF(${content.date}, '')::date,
        slug = ${slug},
        expires_at = CASE WHEN status = 'published' THEN COALESCE(${expires}::timestamptz, expires_at) ELSE expires_at END,
        updated_at = now()
      WHERE id = ${inv.id} AND user_id = ${user.id}`;
  } catch (e) {
    if (typeof e === "object" && e && "code" in e && (e as { code?: string }).code === "23505") {
      throw new HttpError(409, "Ce lien est déjà utilisé, choisissez-en un autre");
    }
    throw e;
  }
  await audit(user.id, "invitation.saved", "invitation", inv.id);
  return json({ ok: true, slug });
});
