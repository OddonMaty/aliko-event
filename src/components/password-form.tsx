"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";

import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm({ mode, token }: { mode: "forgot" | "reset"; token?: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState("");
  const forgot = mode === "forgot";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = forgot ? { email: String(fd.get("email")), turnstile: captcha } : { token, password: String(fd.get("password")) };
    try {
      const res = await fetch(`/api/auth/${forgot ? "forgot" : "reset"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Une erreur est survenue");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl"><MailCheck className="text-primary size-6" />{forgot ? "Vérifiez votre boîte mail" : "Mot de passe modifié"}</CardTitle>
          <CardDescription>
            {forgot ? "Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé. Il est valable 1 heure." : "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."}
          </CardDescription>
        </CardHeader>
        <CardContent><Button asChild className="w-full"><Link href="/connexion">Aller à la connexion</Link></Button></CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{forgot ? "Mot de passe oublié" : "Nouveau mot de passe"}</CardTitle>
        <CardDescription>{forgot ? "Indiquez votre e-mail : nous vous envoyons un lien pour en choisir un nouveau." : "Choisissez un mot de passe d'au moins 8 caractères."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {forgot ? (
            <>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
              <Turnstile onToken={setCaptcha} />
            </>
          ) : (
            <div className="space-y-2"><Label htmlFor="password">Nouveau mot de passe</Label><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} /></div>
          )}
          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}{forgot ? "Envoyer le lien" : "Enregistrer"}</Button>
          <p className="text-muted-foreground text-center text-sm"><Link href="/connexion" className="text-primary underline-offset-4 hover:underline">Retour à la connexion</Link></p>
        </form>
      </CardContent>
    </Card>
  );
}
