"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Bouton flottant sur l'invitation : mène directement à la réponse (ou au pass d'entrée) et disparaît
 * dès que cette partie est à l'écran.
 */
export function InviteShortcut({ targetId, label, accent, bg }: { targetId: string; label: string; accent: string; bg: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <button
      type="button"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="fixed left-1/2 z-30 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-full px-6 text-sm font-semibold shadow-xl transition-all duration-300"
      style={{
        background: accent,
        color: bg,
        bottom: "calc(1rem + env(safe-area-inset-bottom))",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transform: `translateX(-50%) translateY(${visible ? "0" : "1rem"})`,
      }}
    >
      {label}
      <ChevronDown className="size-4" />
    </button>
  );
}
