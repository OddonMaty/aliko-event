import type { MetadataRoute } from "next";

import { CATEGORIES } from "@/lib/catalog";
import { TEMPLATES } from "@/lib/templates";
import { appUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [
    { url: base },
    { url: `${base}/modeles` },
    ...CATEGORIES.map((c) => ({ url: `${base}/modeles?categorie=${c.id}` })),
    ...TEMPLATES.map((t) => ({ url: `${base}/modeles/${t.id}` })),
  ];
}
