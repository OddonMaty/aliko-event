import type { Metadata } from "next";

import { PasswordForm } from "@/components/password-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16"><PasswordForm mode="forgot" /></main>
      <SiteFooter />
    </>
  );
}
