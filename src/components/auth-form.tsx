"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { CodeLogin } from "@/components/code-login";
import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [useCode, setUseCode] = useState(false);
  const isRegister = mode === "register";
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = Object.fromEntries(
      [...fd.entries()].map(([k, v]) => [k, String(v)]),
    );
    payload.turnstile = token;
    if (next) payload.next = next;
    try {
      const res = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Une erreur est survenue");
      window.location.href = data.next ?? "/tableau-de-bord";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{isRegister ? "Créer votre compte" : "Connexion"}</CardTitle>
        <CardDescription>
          {isRegister
            ? "Un compte pour retrouver vos invitations et suivre les réponses."
            : "Retrouvez vos invitations et les réponses de vos invités."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isRegister && useCode ? (
          <CodeLogin next={next} onBack={() => setUseCode(false)} />
        ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (optionnel)</Label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0990000000" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={isRegister ? 8 : 1}
            />
            {isRegister ? (
              <p className="text-muted-foreground text-xs">8 caractères minimum.</p>
            ) : (
              <Link href="/mot-de-passe-oublie" className="text-primary inline-block py-1 text-xs underline-offset-4 hover:underline">Mot de passe oublié ?</Link>
            )}
          </div>
          <Turnstile onToken={setToken} />
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          {isRegister && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              En créant un compte, vous acceptez les{" "}
              <Link href="/cgu" className="text-primary underline-offset-4 hover:underline">
                conditions d&apos;utilisation
              </Link>{" "}
              et la{" "}
              <Link href="/confidentialite" className="text-primary underline-offset-4 hover:underline">
                politique de confidentialité
              </Link>
              .
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {isRegister ? "Créer mon compte" : "Se connecter"}
          </Button>
          {!isRegister && (
            <Button type="button" variant="outline" className="w-full" onClick={() => setUseCode(true)}>
              Recevoir un code par e-mail
            </Button>
          )}
          <p className="text-muted-foreground text-center text-sm">
            {isRegister ? (
              <>
                Déjà un compte ?{" "}
                <Link href={`/connexion${nextQuery}`} className="text-primary underline-offset-4 hover:underline">
                  Connexion
                </Link>
              </>
            ) : (
              <>
                Pas encore de compte ?{" "}
                <Link href={`/inscription${nextQuery}`} className="text-primary underline-offset-4 hover:underline">
                  Créer un compte
                </Link>
              </>
            )}
          </p>
        </form>
        )}
      </CardContent>
    </Card>
  );
}
