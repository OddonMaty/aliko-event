import Link from "next/link";

import { cn } from "@/lib/utils";

// Wordmark provisoire (le logo viendra plus tard).
export function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-baseline gap-2", className)}>
      <span className="font-serif text-xl font-semibold tracking-tight text-foreground">Aliko</span>
      <span className="text-primary text-[11px] font-medium tracking-[0.3em] uppercase">Event</span>
    </Link>
  );
}
