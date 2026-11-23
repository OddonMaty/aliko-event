"use client";

import { useState } from "react";

import { Turnstile } from "@/components/turnstile";

export function ReportButton({ slug, color }: { slug: string; color: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, reason: fd.get("reason"), details: fd.get("details") ?? "", turnstile: token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Envoi impossible");
    setSent(true);
  }

  if (sent) return <p className="py-3 text-center text-xs" style={{ color }}>Merci, votre signalement a été transmis.</p>;

  return (
    <div className="px-6 pb-6 text-center text-xs" style={{ color }}>
      {!open ? (
        <button type="button" className="inline-flex min-h-11 items-center underline underline-offset-4 opacity-70 hover:opacity-100" onClick={() => setOpen(true)}>
          Signaler cette invitation
        </button>
      ) : (
        <form onSubmit={submit} className="mx-auto max-w-xs space-y-2 text-left">
          <select name="reason" required className="w-full rounded border bg-transparent p-2 text-base" defaultValue="">
            <option value="" disabled>Motif du signalement</option>
            <option value="arnaque">Arnaque ou lien suspect</option>
            <option value="contenu-inapproprie">Contenu inapproprié</option>
            <option value="usurpation">Usurpation d'identité</option>
            <option value="autre">Autre</option>
          </select>
          <textarea name="details" maxLength={500} rows={2} placeholder="Détails (optionnel)" className="w-full rounded border bg-transparent p-2 text-base" />
          <Turnstile onToken={setToken} />
          {error && <p role="alert" style={{ color: "#f97066" }}>{error}</p>}
          <button type="submit" className="min-h-10 rounded border px-4 py-2">Envoyer</button>
        </form>
      )}
    </div>
  );
}
