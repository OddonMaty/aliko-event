"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Carte d'un thème : aperçu de la photo d'exemple, remplacement et retour à la photo par défaut. */
export function SamplePhotoCard({ theme, label, src, custom }: { theme: string; label: string; src: string; custom: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"up" | "reset" | null>(null);

  async function upload(file: File) {
    setBusy("up");
    try {
      const fd = new FormData();
      fd.set("theme", theme);
      fd.set("file", file);
      const res = await fetch("/api/admin/sample-photo", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Envoi impossible");
      toast.success(`Photo « ${label} » remplacée`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  async function reset() {
    if (!window.confirm(`Revenir à la photo par défaut pour « ${label} » ?`)) return;
    setBusy("reset");
    try {
      const res = await fetch(`/api/admin/sample-photo?theme=${encodeURIComponent(theme)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Action impossible");
      toast.success("Photo par défaut rétablie");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="bg-card overflow-hidden rounded-xl border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Photo d'exemple : ${label}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
      <div className="space-y-2 p-3">
        <p className="text-sm font-medium">{label} <span className="text-muted-foreground font-normal">· {custom ? "votre photo" : "photo par défaut"}</span></p>
        <div className="flex gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
          <Button type="button" size="sm" className="flex-1" disabled={busy !== null} onClick={() => input.current?.click()}>
            {busy === "up" ? <Loader2 className="animate-spin" /> : <Upload />} Remplacer
          </Button>
          {custom && (
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={reset} aria-label={`Rétablir la photo par défaut de ${label}`}>
              {busy === "reset" ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
