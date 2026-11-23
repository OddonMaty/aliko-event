"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({ value, label = "Copier", className }: { value: string; label?: string; className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(className)}
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
