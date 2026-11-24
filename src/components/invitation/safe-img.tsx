"use client";

import { useState, type CSSProperties } from "react";
import { sampleUrl } from "@/lib/samples";

/** Affiche la photo d'exemple Unsplash du thème ; si elle ne charge pas, retombe sur l'illustration locale. */
export function SafeImg({ src, className, style, width }: { src: string; className?: string; style?: CSSProperties; width?: number }) {
  const [failed, setFailed] = useState(false);
  const shown = failed ? src : sampleUrl(src, width);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={shown} alt="" loading="lazy" className={className} style={style} onError={() => setFailed(true)} />;
}
