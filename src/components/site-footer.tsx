import Link from "next/link";

import { Brand } from "@/components/brand";
import { Separator } from "@/components/ui/separator";
import { LEGAL_LINKS } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="mt-8 md:mt-12">
      <Separator />
      <div className="mx-auto hidden max-w-6xl gap-10 px-5 py-14 md:grid md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Brand />
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
            Des invitations numériques pour vos mariages, anniversaires, baptêmes, conférences et réunions.
          </p>
        </div>
        <nav className="flex flex-col gap-3 text-sm" aria-label="Explorer">
          <span className="font-serif text-lg">Explorer</span>
          <Link href="/modeles" className="text-muted-foreground hover:text-foreground">Modèles</Link>
          <Link href="/#tarifs" className="text-muted-foreground hover:text-foreground">Tarifs</Link>
          <Link href="/#faq" className="text-muted-foreground hover:text-foreground">Questions fréquentes</Link>
        </nav>
        <nav className="flex flex-col gap-3 text-sm" aria-label="Compte">
          <span className="font-serif text-lg">Mon compte</span>
          <Link href="/connexion" className="text-muted-foreground hover:text-foreground">Se connecter</Link>
          <Link href="/inscription" className="text-muted-foreground hover:text-foreground">Créer un compte</Link>
          <Link href="/tableau-de-bord" className="text-muted-foreground hover:text-foreground">Mes invitations</Link>
        </nav>
      </div>
      <Separator className="hidden md:block" />
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-4 text-xs md:flex-row md:py-5">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center">
          <span>© {new Date().getFullYear()} Aliko Event. Tous droits réservés.</span>
          <span>
            Build by{" "}
            <a href="https://saotechagency.com" target="_blank" rel="noopener noreferrer" className="text-foreground underline-offset-4 hover:underline">
              Sao Tech Agency
            </a>
          </span>
        </p>
        <nav aria-label="Informations légales" className="hidden flex-wrap justify-center gap-x-5 gap-y-1 md:flex">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
