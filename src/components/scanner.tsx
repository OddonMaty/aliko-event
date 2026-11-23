"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, Loader2, TriangleAlert, Undo2 } from "lucide-react";
import jsQR from "jsqr";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ScanGuest {
  id: string;
  name: string;
  checkedIn: boolean;
  /** Nombre de personnes annoncé à la réponse (null si pas de réponse ou absent). */
  party: number | null;
}

type Result =
  | { kind: "ok"; name: string; party: number | null }
  | { kind: "already"; name: string; at: string; party: number | null }
  | { kind: "error"; message: string };

export function Scanner({ invitationId, initialGuests }: { invitationId: string; initialGuests: ScanGuest[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const [running, setRunning] = useState(false);
  const [camError, setCamError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [guests, setGuests] = useState(initialGuests);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRunning(false);
  }, []);

  useEffect(() => stop, [stop]);

  const submit = useCallback(
    async (code: string) => {
      busyRef.current = true;
      try {
        const res = await fetch(`/api/invitations/${invitationId}/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setResult({ kind: "error", message: data.error ?? "Scan impossible" });
          navigator.vibrate?.([120, 60, 120]);
          return;
        }
        if (data.status === "ok") {
          setResult({ kind: "ok", name: data.name, party: data.party ?? null });
          setGuests((g) => g.map((x) => (x.id === data.guestId ? { ...x, checkedIn: true } : x)));
          navigator.vibrate?.(80);
        } else {
          setResult({ kind: "already", name: data.name, at: data.at, party: data.party ?? null });
          navigator.vibrate?.([120, 60, 120]);
        }
      } catch {
        setResult({ kind: "error", message: "Connexion impossible. Vérifiez le réseau." });
      } finally {
        busyRef.current = false;
      }
    },
    [invitationId],
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || busyRef.current || video.readyState < 2 || !video.videoWidth) return;
    const scale = Math.min(1, 640 / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
    if (!code?.data) return;
    const now = Date.now();
    // Évite de re-scanner le même pass en boucle tant qu'il est devant la caméra.
    if (code.data === lastRef.current.code && now - lastRef.current.at < 4000) return;
    lastRef.current = { code: code.data, at: now };
    void submit(code.data);
  }, [submit]);

  async function start() {
    setCamError("");
    setResult(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Caméra non disponible sur ce navigateur (ouvrez la page en HTTPS).");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setRunning(true);
      timerRef.current = window.setInterval(tick, 150);
    } catch (e) {
      stop();
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setCamError(denied ? "Accès à la caméra refusé. Autorisez-la dans les réglages du navigateur, puis réessayez." : e instanceof Error ? e.message : "Caméra indisponible");
    }
  }

  async function toggle(g: ScanGuest) {
    setPending(g.id);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/checkin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: g.id, checkedIn: !g.checkedIn }),
      });
      if (!res.ok) throw new Error("Action impossible");
      setGuests((list) => list.map((x) => (x.id === g.id ? { ...x, checkedIn: !g.checkedIn } : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setPending(null);
    }
  }

  const entered = guests.filter((g) => g.checkedIn).length;
  const people = guests.filter((g) => g.checkedIn).reduce((n, g) => n + (g.party ?? 1), 0);
  const shown = guests.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scanner un pass</CardTitle>
          <CardDescription>
            {entered} / {guests.length} invités entrés, soit {people} personne(s). Présentez le QR code du pass devant la caméra.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn("bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl", !running && "hidden")}>
            <video ref={videoRef} playsInline muted className="size-full object-cover" />
            <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-white/80" aria-hidden />
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {running ? (
            <Button type="button" variant="outline" onClick={stop}>
              <CameraOff /> Arrêter la caméra
            </Button>
          ) : (
            <Button type="button" onClick={start}>
              <Camera /> Démarrer la caméra
            </Button>
          )}
          {camError && (
            <p role="alert" className="text-destructive text-sm">
              {camError}
            </p>
          )}

          {result && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4",
                result.kind === "ok" && "border-success/60 bg-success/10",
                result.kind === "already" && "border-primary/60 bg-primary/10",
                result.kind === "error" && "border-destructive/60 bg-destructive/10",
              )}
            >
              {result.kind === "ok" ? (
                <Check className="text-success mt-0.5 size-5 shrink-0" />
              ) : (
                <TriangleAlert className={cn("mt-0.5 size-5 shrink-0", result.kind === "error" ? "text-destructive" : "text-primary")} />
              )}
              <div>
                {result.kind === "ok" && (
                  <>
                    <p className="font-medium">Entrée validée : {result.name}</p>
                    {result.party && result.party > 1 && <p className="text-muted-foreground text-sm">{result.party} personnes annoncées</p>}
                  </>
                )}
                {result.kind === "already" && (
                  <>
                    <p className="font-medium">Déjà entré(e) : {result.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Pass déjà scanné à {new Date(result.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.
                    </p>
                  </>
                )}
                {result.kind === "error" && <p className="font-medium">{result.message}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des invités</CardTitle>
          <CardDescription>Si un QR code ne passe pas, cherchez l&apos;invité et marquez son entrée à la main.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un nom" aria-label="Rechercher un invité" />
          {guests.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">Aucun invité. Ajoutez-les dans l&apos;onglet « Invités ».</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {shown.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">{g.name}</span>
                    {g.party && g.party > 1 && <span className="text-muted-foreground text-xs">({g.party} pers.)</span>}
                    {g.checkedIn && <Badge variant="success">Entré(e)</Badge>}
                  </div>
                  <Button type="button" size="sm" variant={g.checkedIn ? "ghost" : "outline"} onClick={() => toggle(g)} disabled={pending === g.id}>
                    {pending === g.id ? <Loader2 className="animate-spin" /> : g.checkedIn ? <Undo2 /> : <Check />}
                    {g.checkedIn ? "Annuler" : "Marquer entré"}
                  </Button>
                </li>
              ))}
              {shown.length === 0 && <li className="text-muted-foreground p-4 text-center text-sm">Aucun résultat.</li>}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
