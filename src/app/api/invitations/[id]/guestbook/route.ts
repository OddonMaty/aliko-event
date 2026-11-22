import { requireApiUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { handle, json } from "@/lib/http";
import { getOwnedInvitation, isUuid } from "@/lib/invitations";
import { assertSameOrigin, HttpError } from "@/lib/security";

// Modération : l'organisateur peut masquer un mot doux.
export const DELETE = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = (await ctx.params) as { id: string };
  const inv = await getOwnedInvitation(id, user.id);
  const messageId = new URL(req.url).searchParams.get("messageId") ?? "";
  if (!isUuid(messageId)) throw new HttpError(400, "Message invalide");
  await q`UPDATE guestbook SET hidden = true WHERE id = ${messageId} AND invitation_id = ${inv.id}`;
  return json({ ok: true });
});
