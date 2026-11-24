import type { Metadata } from "next";
import Link from "next/link";

import { PasswordForm } from "@/components/password-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">
        {token ? <PasswordForm mode="reset" token={token} /> : (
          <p className="text-center text-sm">Lien incomplet. <Link href="/mot-de-passe-oublie" className="text-primary underline-offset-4 hover:underline">Demander un nouveau lien</Link></p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
