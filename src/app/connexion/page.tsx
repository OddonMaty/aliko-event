import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(safeNext(next));
  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">
        <AuthForm mode="login" next={next ? safeNext(next) : undefined} />
      </main>
      <SiteFooter />
    </>
  );
}
