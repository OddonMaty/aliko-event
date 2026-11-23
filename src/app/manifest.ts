import type { MetadataRoute } from "next";

/** Permet d'ajouter Aliko Event à l'écran d'accueil du téléphone (plein écran, comme une application). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aliko Event",
    short_name: "Aliko",
    description: "Invitations numériques élégantes pour vos événements.",
    lang: "fr",
    start_url: "/tableau-de-bord",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b0a",
    theme_color: "#0b0b0a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
