"use client";

import { useState } from "react";
import { CreditCard, Loader2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatMoney, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";

interface Props {
  templateId: string;
  templateName: string;
  category: string;
  categoryLabel: string;
  tier: string;
  tierLabel: string;
  usd: number;
  cdf: number;
  userName: string;
}

export function CheckoutForm(p: Props) {
  const [method, setMethod] = useState<"mobile" | "card">("mobile");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount = currency === "USD" ? p.usd : p.cdf;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: p.templateId, category: p.category, tier: p.tier, method, currency, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Paiement impossible");
      window.location.href = data.redirectUrl ?? data.next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paiement impossible");
      setLoading(false);
    }
  }

  const choice = (active: boolean) =>
    cn("flex-1 rounded-lg border p-3 text-sm font-medium transition-colors", active ? "border-primary bg-accent/40 ring-primary/40 ring-1" : "hover:bg-accent/20");

  return (
    <form onSubmit={pay} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif</CardTitle>
          <CardDescription>Bonjour {p.userName}, vérifiez votre commande.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Design</span><span>{p.templateName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Événement</span><span>{p.categoryLabel}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Formule</span><span>{p.tierLabel}</span></div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatMoney(amount, currency)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paiement</CardTitle>
          <CardDescription>Sécurisé par FlexPay. Vous personnalisez votre invitation juste après.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Devise</Label>
            <div className="flex gap-2">
              <button type="button" className={choice(currency === "USD")} onClick={() => setCurrency("USD")}>
                Dollars (USD) · {formatMoney(p.usd, "USD")}
              </button>
              <button type="button" className={choice(currency === "CDF")} onClick={() => setCurrency("CDF")}>
                Francs (CDF) · {formatMoney(p.cdf, "CDF")}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Moyen de paiement</Label>
            <div className="flex gap-2">
              <button type="button" className={choice(method === "mobile")} onClick={() => setMethod("mobile")}>
                <Smartphone className="mr-2 inline size-4" /> Mobile Money
              </button>
              <button type="button" className={choice(method === "card")} onClick={() => setMethod("card")}>
                <CreditCard className="mr-2 inline size-4" /> Carte bancaire
              </button>
            </div>
          </div>

          {method === "mobile" ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro Mobile Money</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="0990000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Vous recevrez une demande de confirmation sur ce numéro (M-Pesa, Airtel Money, Orange Money).
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Vous serez redirigé vers la page de paiement sécurisée pour saisir votre carte.</p>
          )}

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Payer {formatMoney(amount, currency)}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
