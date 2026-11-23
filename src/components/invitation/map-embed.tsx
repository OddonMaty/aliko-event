"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

/** Carte du lieu : chargée uniquement au clic, pour ne rien envoyer à Google sans l'accord de l'invité. */
export function MapEmbed({ src, accent, fg, bg }: { src: string; accent: string; fg: string; bg: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="mt-5 overflow-hidden rounded-xl" style={{ border: `1px solid ${accent}55` }}>
      {shown ? (
        <iframe src={src} title="Carte du lieu" referrerPolicy="no-referrer" className="block h-60 w-full border-0" />
      ) : (
        <button
          type="button"
          onClick={() => setShown(true)}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 text-sm"
          style={{ background: `${accent}14`, color: fg }}
        >
          <MapPin className="size-5" style={{ color: accent }} />
          <span className="rounded-full px-4 py-1.5 font-medium" style={{ background: accent, color: bg }}>
            Afficher la carte
          </span>
          <span className="text-xs opacity-70">Charge une carte Google</span>
        </button>
      )}
    </div>
  );
}
