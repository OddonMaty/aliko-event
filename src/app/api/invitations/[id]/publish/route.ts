import { requireApiUser } from "@/lib/auth";
import { getCategory } from "@/lib/catalog";
import { q } from "@/lib/db";
import { handle, json } from "@/lib/http";
import { expiryFromEventDate, getOwnedInvitation, parseStoredContent, todayKinshasa } from "@/lib/invitations";
import { assertSameOrigin, audit, HttpError } from "@/lib/security";

export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = (await ctx.params) as { id: string };
  const inv = await getOwnedInvitation(id, user.id);

  if (inv.status === "awaiting_payment") throw new HttpError(402, "Paiement requis avant publication");
  if (inv.status !== "draft" && inv.status !== "published") throw new HttpError(403, "Publication impossible");

  const content = parseStoredContent(inv.content);
  const sample = getCategory(inv.category)?.sample;
  if (!content.title || content.title === sample?.title) throw new HttpError(400, "Personnalisez le titre avant de publier");
  if (!content.date) throw new HttpError(400, "Indiquez la date de l'événement");
  if (!content.venueName) throw new HttpError(400, "Indiquez le lieu de l'événement");

  if (content.date < todayKinshasa()) throw new HttpError(400, "La date de l'événement est déjà passée");

  await q`
    UPDATE invitations SET status = 'published', published_at = COALESCE(published_at, now()),
      event_date = ${content.date}::date, expires_at = ${expiryFromEventDate(content.date)}::timestamptz, updated_at = now()
    WHERE id = ${inv.id} AND user_id = ${user.id}`;
  await audit(user.id, "invitation.published", "invitation", inv.id);
  return json({ ok: true, slug: inv.slug });
});
