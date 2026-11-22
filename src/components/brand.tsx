import Link from "next/link";

import { cn } from "@/lib/utils";

// Wordmark provisoire (le logo viendra plus tard).
export function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-baseline gap-1.5", className)} aria-label="Aliko Event, accueil">
      <span className="font-serif text-[1.65rem] leading-none font-semibold tracking-tight">Aliko</span>
      <span className="text-primary text-sm font-medium tracking-wide">event</span>
    </Link>
  );
}
