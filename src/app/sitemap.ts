import type { MetadataRoute } from "next";

import { CATEGORIES } from "@/lib/catalog";
import { TEMPLATES } from "@/lib/templates";
import { appUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [
    { url: base },
    { url: `${base}/modeles` },
    { url: `${base}/cgu` },
    { url: `${base}/confidentialite` },
    { url: `${base}/remboursement` },
    { url: `${base}/cookies` },
    ...CATEGORIES.map((c) => ({ url: `${base}/modeles?categorie=${c.id}` })),
    ...TEMPLATES.map((t) => ({ url: `${base}/modeles/${t.id}` })),
  ];
}
