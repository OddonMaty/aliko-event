"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const LINKS = [
  { href: "/modeles", label: "Modèles" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#faq", label: "Questions fréquentes" },
];

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Aliko event</SheetTitle>
          <SheetDescription>Invitations numériques pour vos événements.</SheetDescription>
        </SheetHeader>
        <nav className="mt-4 flex flex-col">
          {LINKS.map((l) => (
            <SheetClose asChild key={l.href}>
              <Link href={l.href} className="border-b py-4 font-serif text-2xl">
                {l.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          {signedIn ? (
            <SheetClose asChild>
              <Button asChild size="lg">
                <Link href="/tableau-de-bord">Mes invitations</Link>
              </Button>
            </SheetClose>
          ) : (
            <>
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
