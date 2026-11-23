"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Partage natif du téléphone (WhatsApp, SMS, e-mail…). Ne s'affiche que si le navigateur le permet. */
export function ShareButton({ title, text, url, label = "Partager" }: { title: string; text: string; url: string; label?: string }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);
  if (!supported) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.share({ title, text, url });
        } catch {
          /* partage annulé par l'utilisateur */
        }
      }}
    >
      <Share2 /> {label}
    </Button>
  );
}
