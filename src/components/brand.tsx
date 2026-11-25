import Link from "next/link";

import { cn } from "@/lib/utils";

/** Sceau « AE » : cachet doré (couleur primaire du thème) avec les lettres A et E découpées dedans. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cn("size-9 shrink-0", className)}>
      <circle cx="50" cy="50" r="46" className="fill-primary" />
      <circle cx="50" cy="50" r="40" fill="none" strokeWidth="1.5" className="stroke-primary-foreground" />
      <g fill="none" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground">
        <path d="M21 72 L35 28 L49 72" />
        <path d="M27 58 H43" />
        <path d="M60 28 V72 M60 28 H79 M60 50 H75 M60 72 H79" />
      </g>
    </svg>
  );
}

/** Logo : sceau + nom « Aliko Event ». */
export function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="Aliko Event, accueil">
      <BrandMark />
      <span className="font-serif text-[1.35rem] leading-none font-semibold tracking-wide">Aliko Event</span>
    </Link>
  );
}
