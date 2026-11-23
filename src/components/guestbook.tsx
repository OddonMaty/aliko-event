"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Turnstile } from "@/components/turnstile";
import type { Template } from "@/lib/templates";

export interface GuestbookMessage {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const fmt = (iso: string) => dateFmt.format(new Date(iso));

export function Guestbook({
  slug,
  template,
  guest,
  initial,
}: {
  slug: string;
  template: Template;
  guest?: { token: string; name: string };
  initial: GuestbookMessage[];
}) {
  const p = template.palette;
  const [messages, setMessages] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");

  const field = { background: "transparent", color: p.fg, border: `1px solid ${p.accent}66` } as const;
  const inputCls = "w-full rounded-lg px-3.5 py-3 text-base outline-none placeholder:opacity-50 focus:ring-2";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          guestToken: guest?.token,
          name: guest ? guest.name : fd.get("name"),
          message: fd.get("message"),
          turnstile: token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Envoi impossible");
      setMessages((m) => [data.message as GuestbookMessage, ...m]);
      setSent(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-6 py-10" style={{ background: p.bg }}>
      <h2 className="mb-5 text-center text-2xl italic" style={{ fontFamily: template.fonts.display, color: p.fg }}>
        Mots doux
      </h2>

      <form onSubmit={submit} className="space-y-3">
        {!guest && <input name="name" required minLength={2} maxLength={60} placeholder="Votre nom" autoComplete="name" className={inputCls} style={field} />}
        <textarea
          name="message"
          required
          minLength={2}
          maxLength={280}
          rows={3}
          placeholder="Votre message pour les hôtes…"
          className={inputCls}
          style={field}
        />
        <Turnstile onToken={setToken} />
        {error && (
          <p role="alert" className="text-sm" style={{ color: "#f97066" }}>
            {error}
          </p>
        )}
        {sent && !error && (
          <p role="status" className="text-center text-sm" style={{ color: p.accent }}>
            Votre message a été ajouté. Merci !
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-base font-semibold disabled:opacity-60"
          style={{ background: p.accent, color: p.bg }}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Laisser un message
        </button>
      </form>

      {messages.length > 0 && (
        <>
          <p className="mt-8 mb-3 text-center text-[10px] tracking-[0.3em] uppercase" style={{ color: p.muted }}>
            {messages.length} message{messages.length > 1 ? "s" : ""}
          </p>
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-xl p-4" style={{ background: p.surface, color: p.fg }}>
                <p className="text-sm italic" style={{ fontFamily: template.fonts.display }}>
                  « {m.message} »
                </p>
                <p className="mt-2 flex items-center justify-between text-[10px] tracking-[0.15em] uppercase" style={{ color: p.accent }}>
                  <span>{m.name}</span>
                  <span style={{ color: p.muted }}>{fmt(m.created_at)}</span>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
