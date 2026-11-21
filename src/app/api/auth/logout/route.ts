import { destroySession } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  await destroySession();
  return json({ ok: true });
});
