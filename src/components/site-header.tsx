import Link from "next/link";

import { Brand } from "@/components/brand";
import { MobileTabBar } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Bell } from "lucide-react";
import { unreadCount } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser().catch(() => null);
  const unread = user ? await unreadCount(user.id) : 0;
  return (
    <>
    <header className="bg-background/85 sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 md:h-16 md:px-5">
        <Brand />
        <nav className="text-muted-foreground hidden items-center gap-7 text-sm md:flex" aria-label="Navigation principale">
          <Link href="/modeles" className="hover:text-foreground transition-colors">Modèles</Link>
          <Link href="/#tarifs" className="hover:text-foreground transition-colors">Tarifs</Link>
          <Link href="/#faq" className="hover:text-foreground transition-colors">Questions fréquentes</Link>
        </nav>
        <div className="flex items-center gap-1.5">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          {user && (
            <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} nouvelle(s)` : "Notifications"} className="hover:bg-accent relative inline-flex size-11 items-center justify-center rounded-full md:size-9">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="bg-primary text-primary-foreground absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-semibold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <div className="hidden md:block">
              <UserMenu name={user.name} email={user.email} isAdmin={user.role === "admin"} />
            </div>
          ) : (
            <>
              <div className="hidden items-center gap-1.5 md:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/connexion">Se connecter</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/inscription">Créer un compte</Link>
                </Button>
              </div>
              <Button asChild size="sm" className="md:hidden">
                <Link href="/connexion">Connexion</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
    {/* Hors du <header> : son flou d'arrière-plan piégerait un élément fixe. */}
    <MobileTabBar user={user ? { name: user.name, email: user.email, isAdmin: user.role === "admin" } : null} />
    </>
  );
}
