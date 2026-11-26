"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CircleHelp, FileText, Home, LayoutGrid, LogOut, Menu, ShieldCheck, Tag, Ticket } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LEGAL_LINKS } from "@/lib/legal";
import { cn } from "@/lib/utils";

interface Props {
  user: { name: string; email: string; isAdmin: boolean } | null;
}

const TABS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/modeles", label: "Modèles", icon: LayoutGrid },
  { href: "/tableau-de-bord", label: "Invitations", icon: Ticket },
] as const;

const tabClass = "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors";

function MenuRow({ href, icon: Icon, children }: { href: string; icon: typeof Tag; children: React.ReactNode }) {
  return (
    <SheetClose asChild>
      <Link href={href} className="active:bg-accent/60 -mx-2 flex min-h-12 items-center gap-3 rounded-lg px-2 text-base">
        <Icon className="text-muted-foreground size-5" />
        {children}
      </Link>
    </SheetClose>
  );
}

export function MobileTabBar({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <nav
        data-tabbar
        aria-label="Navigation"
        className="bg-background/92 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-4">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(tabClass, active ? "text-primary" : "text-muted-foreground active:text-foreground")}
              >
                {active && <span className="bg-primary absolute top-0 h-0.5 w-8 rounded-b-full" aria-hidden />}
                <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            );
          })}
          <SheetTrigger asChild>
            <button type="button" className={cn(tabClass, "text-muted-foreground active:text-foreground")} aria-label="Ouvrir le menu">
              <Menu className="size-[22px]" strokeWidth={1.75} />
              Menu
            </button>
          </SheetTrigger>
        </div>
      </nav>

      <SheetContent side="bottom">
        <div className="bg-muted-foreground/30 mx-auto h-1 w-10 shrink-0 rounded-full" aria-hidden />
        <div className="pt-1">
          <SheetTitle className="text-xl">{user ? user.name : "Aliko event"}</SheetTitle>
          <SheetDescription className="truncate">{user ? user.email : "Invitations numériques pour vos événements."}</SheetDescription>
        </div>

        <nav className="flex flex-col" aria-label="Menu">
          <MenuRow href="/#tarifs" icon={Tag}>Tarifs</MenuRow>
          <MenuRow href="/#faq" icon={CircleHelp}>Questions fréquentes</MenuRow>
          {user?.isAdmin && (
            <MenuRow href="/admin" icon={ShieldCheck}>Administration</MenuRow>
          )}
          <MenuRow href="/cgu" icon={FileText}>Conditions et confidentialité</MenuRow>
        </nav>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-base">Apparence</span>
          <ThemeToggle />
        </div>

        {user ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/";
            }}
          >
            <LogOut /> Se déconnecter
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <SheetClose asChild>
              <Button asChild size="lg">
                <Link href="/inscription">Créer un compte</Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button asChild size="lg" variant="outline">
                <Link href="/connexion">Se connecter</Link>
              </Button>
            </SheetClose>
          </div>
        )}

        <nav aria-label="Informations légales" className="text-muted-foreground flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          {LEGAL_LINKS.map((l) => (
            <SheetClose asChild key={l.href}>
              <Link href={l.href} className="py-1">{l.label}</Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
