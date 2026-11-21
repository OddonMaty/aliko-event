"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Turnstile } from "@/components/turnstile";
import type { Template } from "@/lib/templates";

type Att = "yes" | "no" | "maybe";

export function RsvpForm({ slug, template, deadline }: { slug: string; template: Template; deadline?: string }) {
  const p = template.palette;
  const [attendance, setAttendance] = useState<Att>("yes");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { updated: boolean }>(null);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const field = {
    background: "transparent",
    color: p.fg,
    border: `1px solid ${p.accent}66`,
  } as const;
  const inputCls = "w-full rounded-md px-3 py-2 text-sm outline-none placeholder:opacity-50 focus:ring-2";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: fd.get("name"),
          phone: fd.get("phone") ?? "",
          attendance,
          partySize: attendance === "no" ? 1 : Number(fd.get("partySize") ?? 1),
          message: fd.get("message") ?? "",
          turnstile: token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Envoi impossible");
      setDone({ updated: Boolean(data.updated) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section className="px-6 pb-12 text-center" style={{ background: p.bg }}>
        <div className="rounded-lg p-8" style={{ background: p.surface, color: p.fg }}>
          <Check className="mx-auto mb-3 size-8" style={{ color: p.accent }} />
          <p className="text-lg font-semibold" style={{ fontFamily: template.fonts.display }}>
            Merci, votre réponse est enregistrée{done.updated ? " (mise à jour)" : ""} !
          </p>
        </div>
      </section>
    );
  }

  const opt = (v: Att, label: string) => (
    <button
      key={v}
      type="button"
      onClick={() => setAttendance(v)}
      aria-pressed={attendance === v}
      className="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
      style={
        attendance === v
          ? { background: p.accent, color: p.bg, border: `1px solid ${p.accent}` }
          : { background: "transparent", color: p.fg, border: `1px solid ${p.accent}66` }
      }
    >
      {label}
    </button>
  );

  return (
    <section className="px-6 pb-12" style={{ background: p.bg }}>
      <form onSubmit={submit} className="space-y-4 rounded-lg p-6" style={{ background: p.surface, color: p.fg }}>
        <h2 className="text-center text-xl font-semibold" style={{ fontFamily: template.fonts.display }}>
          Confirmez votre présence
        </h2>
        {deadline && (
          <p className="text-center text-xs" style={{ color: p.muted }}>
            Merci de répondre avant le {deadline.split("-").reverse().join("/")}
          </p>
        )}
        <div className="flex gap-2" role="group" aria-label="Votre réponse">
          {opt("yes", "Je serai là")}
          {opt("maybe", "Peut-être")}
          {opt("no", "Absent")}
        </div>
        <input name="name" required minLength={2} maxLength={80} placeholder="Votre nom" autoComplete="name" className={inputCls} style={field} />
        <input name="phone" type="tel" maxLength={30} placeholder="Téléphone (optionnel)" autoComplete="tel" className={inputCls} style={field} />
        {attendance !== "no" && (
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Nombre de personnes</span>
            <select name="partySize" defaultValue="1" className="rounded-md px-3 py-2 text-sm" style={{ ...field, background: p.surface }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <textarea name="message" rows={3} maxLength={300} placeholder="Un petit mot (optionnel)" className={inputCls} style={field} />
        <Turnstile onToken={setToken} />
        {error && (
          <p role="alert" className="text-sm" style={{ color: "#f97066" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: p.accent, color: p.bg }}
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Envoyer ma réponse
        </button>
      </form>
    </section>
  );
}
