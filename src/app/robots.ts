import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/utils";

// Les invitations (/i/…), le tableau de bord, l'administration et l'API ne doivent jamais être indexés.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/i/", "/api/", "/admin", "/tableau-de-bord", "/acheter"] }],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
