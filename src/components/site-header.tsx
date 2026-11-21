import Link from "next/link";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser().catch(() => null);
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/modeles">Modèles</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/#tarifs">Tarifs</Link>
          </Button>
          {user ? (
            <Button asChild size="sm">
              <Link href="/tableau-de-bord">Mes invitations</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/inscription">Créer un compte</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
