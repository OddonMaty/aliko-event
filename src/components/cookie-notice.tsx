"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const KEY = "aliko-cookie-notice";

/** Information sur les cookies : Aliko Event n'utilise que des cookies indispensables, il n'y a donc rien à refuser. */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <div role="region" aria-label="Information sur les cookies" className="cookie-notice bg-card fixed inset-x-3 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-xl border p-4 shadow-xl sm:flex-row sm:items-center">
      <p className="text-sm leading-relaxed">
        Nous n&apos;utilisons que des cookies indispensables au fonctionnement du site, sans publicité ni suivi.{" "}
        <Link href="/cookies" className="text-primary underline-offset-4 hover:underline">
          En savoir plus
        </Link>
      </p>
      <Button
        size="sm"
        className="shrink-0"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            /* stockage indisponible : on masque simplement l'avis */
          }
          setVisible(false);
        }}
      >
        J&apos;ai compris
      </Button>
    </div>
  );
}
