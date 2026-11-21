"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type State = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export function OrderStatus({ orderId, cancelled }: { orderId: string; cancelled?: boolean }) {
  const [status, setStatus] = useState<State>(cancelled ? "cancelled" : "pending");
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let stop = false;
    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { status: State; invitationId: string | null };
          if (stop) return;
          setStatus(data.status);
          setInvitationId(data.invitationId);
          if (data.status === "paid") return;
          if (data.status === "failed" || data.status === "cancelled") {
            // un retard de callback est possible : on continue un peu avant d'abandonner
            setTries((t) => t + 1);
          }
        }
      } catch {
        /* on réessaie */
      }
      if (!stop) timer.current = setTimeout(poll, 4000);
    }
    poll();
    return () => {
      stop = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [orderId]);

  if (!orderId) {
    return <p className="text-center">Commande introuvable.</p>;
  }

  if (status === "paid") {
    return (
      <Card className="text-center">
        <CardHeader className="items-center">
          <CheckCircle2 className="text-success size-12" />
          <CardTitle className="mt-2 text-2xl">Paiement confirmé</CardTitle>
          <CardDescription>Votre design est prêt. Personnalisez maintenant votre invitation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg">
            <Link href={invitationId ? `/tableau-de-bord/${invitationId}` : "/tableau-de-bord"}>Personnaliser mon invitation</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if ((status === "failed" || status === "cancelled") && tries > 3) {
    return (
      <Card className="text-center">
        <CardHeader className="items-center">
          <XCircle className="text-destructive size-12" />
          <CardTitle className="mt-2 text-2xl">Paiement non abouti</CardTitle>
          <CardDescription>Le paiement a été refusé ou annulé. Vous n'avez pas été débité.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2">
          <Button asChild>
            <Link href="/modeles">Réessayer</Link>
          </Button>
          <p className="text-muted-foreground text-xs">Si vous avez été débité, patientez quelques minutes : la confirmation peut arriver avec un léger retard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <CardHeader className="items-center">
        <Loader2 className="text-primary size-12 animate-spin" />
        <CardTitle className="mt-2 text-2xl">En attente de confirmation</CardTitle>
        <CardDescription>
          Validez la demande de paiement sur votre téléphone (saisissez votre code secret). Cette page se met à jour automatiquement.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
