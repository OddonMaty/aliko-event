"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Turnstile } from "@/components/turnstile";
import type { Template } from "@/lib/templates";

type Att = "yes" | "no" | "maybe";

interface Props {
  slug: string;
  template: Template;
  deadline?: string;
  /** Invité identifié par son lien personnel. */
  guest?: { token: string; name: string; partyType: "single" | "couple" };
  /** Réponse déjà enregistrée pour cet invité. */
  answered?: Att | null;
  /** Boissons proposées par l'organisateur (vide = pas de choix). */
  drinks?: string[];
}

export function RsvpForm({ slug, template, deadline, guest, answered = null, drinks = [] }: Props) {
  const p = template.palette;
  const [party, setParty] = useState<1 | 2>(1);
  const [attendance, setAttendance] = useState<Att>(answered ?? "yes");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<Att | null>(answered);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const field = {
    background: "transparent",
    color: p.fg,
    border: `1px solid ${p.accent}66`,
  } as const;
  const inputCls = "w-full rounded-lg px-3.5 py-3 text-base outline-none placeholder:opacity-50 focus:ring-2";

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
          guestToken: guest?.token,
          name: guest ? guest.name : fd.get("name"),
          phone: fd.get("phone") ?? "",
          attendance,
          partySize: attendance === "no" ? 1 : guest ? (guest.partyType === "couple" ? 2 : 1) : party,
          message: fd.get("message") ?? "",
          drink: attendance === "no" ? "" : String(fd.get("drink") ?? ""),
          turnstile: token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Envoi impossible");
      setDone(attendance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const first = guest?.name.split(" ")[0];
    const text =
      done === "yes"
        ? `Présence confirmée. À très bientôt${first ? `, ${first}` : ""}.`
        : done === "no"
          ? "Réponse enregistrée. Vous nous manquerez."
          : "Réponse enregistrée. Confirmez-nous dès que possible.";
    return (
      <section className="px-5 py-8 text-center sm:px-6 sm:py-10" style={{ background: p.bg }}>
        <h2 className="mb-5 text-2xl italic" style={{ fontFamily: template.fonts.display, color: p.fg }}>
          Votre présence
        </h2>
        <div className="rounded-2xl p-8" style={{ background: p.surface, color: p.fg }}>
          <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full" style={{ background: `${p.accent}26` }}>
            <Check className="size-5" style={{ color: p.accent }} />
          </span>
          <p className="text-lg" style={{ fontFamily: template.fonts.display }}>
            {text}
          </p>
          <button type="button" onClick={() => setDone(null)} className="mt-4 text-xs underline underline-offset-4" style={{ color: p.muted }}>
            Modifier ma réponse
          </button>
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
      className="min-h-11 flex-1 rounded-full px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.98]"
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
    <section className="px-5 py-8 sm:px-6 sm:py-10" style={{ background: p.bg }}>
      <h2 className="mb-5 text-center text-2xl italic" style={{ fontFamily: template.fonts.display, color: p.fg }}>
        Votre présence
      </h2>
      <form onSubmit={submit} className="space-y-4 rounded-2xl p-4 sm:p-6" style={{ background: p.surface, color: p.fg }}>
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
        {guest ? (
          <p className="text-center text-sm" style={{ color: p.muted }}>
            Réponse au nom de <span style={{ color: p.fg }}>{guest.name}</span>
          </p>
        ) : (
          <>
            <input name="name" required minLength={2} maxLength={80} placeholder="Votre nom complet" autoComplete="name" className={inputCls} style={field} />
            <input name="phone" type="tel" maxLength={30} placeholder="Téléphone (optionnel)" autoComplete="tel" className={inputCls} style={field} />
          </>
        )}
        {attendance !== "no" && !guest && (
          <div role="radiogroup" aria-label="Vous venez" className="grid grid-cols-2 gap-2">
            {([[1, "Seul(e)"], [2, "En couple"]] as const).map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={party === v}
                onClick={() => setParty(v)}
                className="min-h-11 rounded-lg px-3 text-sm font-medium transition-colors"
                style={party === v ? { background: p.accent, color: p.bg, border: `1px solid ${p.accent}` } : field}
              >
                {l}
              </button>
            ))}
          </div>
        )}
        {attendance !== "no" && guest && (
          <p className="text-center text-sm" style={{ color: p.muted }}>
            {guest.partyType === "couple" ? "Votre invitation est valable pour deux personnes." : "Votre invitation est personnelle."}
          </p>
        )}
        {attendance !== "no" && drinks.length > 0 && (
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Boisson souhaitée</span>
            <select name="drink" defaultValue="" className="min-h-11 min-w-0 max-w-[60%] rounded-lg px-3 py-2 text-base" style={{ ...field, background: p.surface }}>
              <option value="">Pas de préférence</option>
              {drinks.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
        <textarea name="message" rows={2} maxLength={300} placeholder="Un message privé pour les hôtes (optionnel)" className={inputCls} style={field} />
        <Turnstile onToken={setToken} />
        {error && (
          <p role="alert" className="text-sm" style={{ color: "#f97066" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          style={{ background: p.accent, color: p.bg }}
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Envoyer ma réponse
        </button>
      </form>
    </section>
  );
}
