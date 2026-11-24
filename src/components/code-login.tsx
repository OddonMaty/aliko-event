"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function post(url: string, body: Record<string, string>) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Une erreur est survenue");
  return data as { next?: string };
}

/** Connexion sans mot de passe : un code à 6 chiffres reçu par e-mail. */
export function CodeLogin({ next, onBack }: { next?: string; onBack: () => void }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<void>) {
    setError("");
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
    setLoading(false);
  }

  const sendCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    return run(async () => {
      await post("/api/auth/code/request", { email, turnstile: token });
      setStep("code");
    });
  };

  const verify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    return run(async () => {
      const data = await post("/api/auth/code/verify", { email, code, ...(next ? { next } : {}) });
      window.location.href = data.next ?? "/tableau-de-bord";
    });
  };

  return step === "email" ? (
    <form onSubmit={sendCode} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code-email">Email</Label>
        <Input id="code-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <p className="text-muted-foreground text-xs">Nous vous envoyons un code à 6 chiffres. Aucun mot de passe à retenir.</p>
      </div>
      <Turnstile onToken={setToken} />
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />}Recevoir mon code
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>Utiliser mon mot de passe</Button>
    </form>
  ) : (
    <form onSubmit={verify} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Code reçu par e-mail</Label>
        <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus className="text-center text-2xl tracking-[0.5em]" />
        <p className="text-muted-foreground text-xs">
          Si un compte existe pour {email}, un code vient d&apos;être envoyé. Il est valable 10 minutes. Pensez aux courriers indésirables.
        </p>
      </div>
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />}Se connecter
      </Button>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" disabled={loading} onClick={() => { setToken(""); setStep("email"); }}>Changer d&apos;e-mail</Button>
        <Button type="button" variant="ghost" className="flex-1" disabled={loading} onClick={() => sendCode()}>Renvoyer le code</Button>
      </div>
    </form>
  );
}
