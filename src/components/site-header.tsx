import Link from "next/link";

import { Brand } from "@/components/brand";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser().catch(() => null);
  return (
    <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Brand />
        <nav className="text-muted-foreground hidden items-center gap-7 text-sm md:flex" aria-label="Navigation principale">
          <Link href="/modeles" className="hover:text-foreground transition-colors">Modèles</Link>
          <Link href="/#tarifs" className="hover:text-foreground transition-colors">Tarifs</Link>
          <Link href="/#faq" className="hover:text-foreground transition-colors">Questions fréquentes</Link>
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <UserMenu name={user.name} email={user.email} isAdmin={user.role === "admin"} />
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/connexion">Se connecter</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inscription">Créer un compte</Link>
              </Button>
            </div>
          )}
          <MobileNav signedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
