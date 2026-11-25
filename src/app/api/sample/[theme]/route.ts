import { NextResponse } from "next/server";

import { getSettings } from "@/lib/settings";
import { SAMPLE_THEMES, unsplashUrl } from "@/lib/samples";

// Redirige vers la photo d'exemple du thème : celle de l'administrateur si elle existe, sinon la photo par défaut.
export async function GET(req: Request, ctx: { params: Promise<{ theme: string }> }) {
  const { theme } = await ctx.params;
  if (!SAMPLE_THEMES.includes(theme)) return new NextResponse("Not found", { status: 404 });
  const w = Math.min(1600, Math.max(200, Number(new URL(req.url).searchParams.get("w")) || 1200));
  const settings = await getSettings();
  const target = settings.samples[theme] ?? unsplashUrl(theme, w)!;
  return new NextResponse(null, { status: 307, headers: { Location: target, "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
