"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Loader2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, type Currency } from "@/lib/money";

export function TestPayment({ orderId, amount, currency, reference }: { orderId: string; amount: number; currency: Currency; reference: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"success" | "failure" | null>(null);
  const [error, setError] = useState("");

  async function run(outcome: "success" | "failure") {
    setError("");
    setBusy(outcome);
    try {
      const res = await fetch("/api/test-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, outcome }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Simulation impossible");
      router.push(`/acheter/retour?order=${orderId}${outcome === "failure" ? "&r=decline" : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation impossible");
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-primary mb-1 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
          <FlaskConical className="size-4" /> Paiement simulé
        </div>
        <CardTitle className="text-2xl">{formatMoney(amount, currency)}</CardTitle>
        <CardDescription>Référence {reference}. Aucun argent réel n&apos;est prélevé.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>Choisissez le résultat à simuler pour tester le parcours complet, comme après un vrai paiement.</Alert>
        {error && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button className="w-full sm:flex-1" size="lg" disabled={busy !== null} onClick={() => run("success")}>
          {busy === "success" && <Loader2 className="animate-spin" />} Paiement réussi
        </Button>
        <Button className="w-full sm:flex-1" size="lg" variant="outline" disabled={busy !== null} onClick={() => run("failure")}>
          {busy === "failure" && <Loader2 className="animate-spin" />} Paiement échoué
        </Button>
      </CardFooter>
    </Card>
  );
}
