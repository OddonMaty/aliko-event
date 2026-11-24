import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { googleConfigured } from "@/lib/google";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const { next, erreur } = await searchParams;
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(safeNext(next));
  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">
        <AuthForm mode="register" next={next ? safeNext(next) : undefined} google={googleConfigured()} notice={erreur} />
      </main>
      <SiteFooter />
    </>
  );
}
