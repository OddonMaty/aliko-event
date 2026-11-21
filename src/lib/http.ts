import { ZodError } from "zod";
import { HttpError } from "./security";

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

type Handler = (
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: { params: Promise<any> },
) => Promise<Response>;

/** Enveloppe de route : transforme les erreurs en réponses JSON propres. */
export function handle(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e instanceof ZodError) {
        return json({ error: e.issues[0]?.message ?? "Données invalides" }, 400);
      }
      console.error("[api]", e);
      return json({ error: "Une erreur est survenue. Réessayez." }, 500);
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Requête invalide");
  }
}
