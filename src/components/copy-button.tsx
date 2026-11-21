"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyButton({ value, label = "Copier" }: { value: string; label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success("Lien copié");
        } catch {
          toast.error("Copie impossible");
        }
      }}
    >
      <Copy /> {label}
    </Button>
  );
}
