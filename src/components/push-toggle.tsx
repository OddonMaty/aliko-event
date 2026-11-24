"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Active ou coupe les alertes sur cet appareil. Masqué si le navigateur ou le service ne le permet pas. */
export function PushToggle() {
  const [state, setState] = useState<"hidden" | "off" | "on" | "busy" | "denied">("hidden");

  useEffect(() => {
    if (!KEY || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    if (Notification.permission === "denied") return setState("denied");
    navigator.serviceWorker.register("/sw.js").then((reg) => reg.pushManager.getSubscription()).then((s) => setState(s ? "on" : "off")).catch(() => setState("hidden"));
  }, []);

  if (state === "hidden") return null;
  if (state === "denied") return <p className="text-muted-foreground text-xs">Les notifications sont bloquées dans les réglages de ce navigateur.</p>;

  async function enable() {
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(KEY!) });
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error();
      setState("on");
      toast.success("Alertes activées sur cet appareil");
    } catch {
      setState("off");
      toast.error("Impossible d'activer les alertes sur cet appareil");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
    } finally {
      setState("off");
    }
  }

  return state === "on" ? (
    <Button variant="outline" size="sm" onClick={disable}><BellOff className="size-4" />Couper les alertes</Button>
  ) : (
    <Button variant="outline" size="sm" onClick={enable} disabled={state === "busy"}>
      {state === "busy" ? <Loader2 className="animate-spin" /> : <BellRing className="size-4" />}Recevoir les alertes sur ce téléphone
    </Button>
  );
}
