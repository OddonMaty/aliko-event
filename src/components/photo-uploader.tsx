"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Redimensionne et compresse l'image dans le navigateur (max 1600 px, JPEG) : rapide et léger, et retire les métadonnées (EXIF/GPS). */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image illisible");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Compression impossible"))), "image/jpeg", 0.82),
  );
}

/** Illustration d'exemple fournie par Aliko Event : elle ne compte pas dans la limite et laisse la place aux vraies photos. */
const isSample = (u: string) => u.startsWith("/samples/");

export function PhotoUploader({
  invitationId,
  photos,
  max,
  onChange,
}: {
  invitationId: string;
  photos: string[];
  max: number;
  onChange: (photos: string[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let next = [...photos];
    for (const file of Array.from(files)) {
      if (next.filter((p) => !isSample(p)).length >= max) {
        toast.error(`Votre formule autorise ${max} photo(s) au maximum.`);
        break;
      }
      try {
        const blob = await compress(file);
        const fd = new FormData();
        fd.set("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        fd.set("invitationId", invitationId);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Téléversement impossible");
        next = [...next.filter((p) => !isSample(p)), data.url as string];
        onChange(next);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Téléversement impossible");
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((src, i) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            {i === 0 && <span className="bg-primary text-primary-foreground absolute bottom-1 left-1 rounded px-1.5 text-[10px]">Couverture</span>}
            <button
              type="button"
              aria-label="Retirer la photo"
              className="bg-background/90 absolute top-1 right-1 flex size-8 items-center justify-center rounded-full shadow"
              onClick={() => onChange(photos.filter((p) => p !== src))}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={busy || photos.filter((p) => !isSample(p)).length >= max} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        Ajouter des photos ({photos.filter((p) => !isSample(p)).length}/{max})
      </Button>
      <p className="text-muted-foreground text-xs">La première photo sert de couverture. L'illustration d'exemple disparaît dès que vous ajoutez la vôtre. JPEG, PNG ou WebP.</p>
    </div>
  );
}
