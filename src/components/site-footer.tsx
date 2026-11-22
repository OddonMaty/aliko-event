import Link from "next/link";

import { Brand } from "@/components/brand";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="mt-12">
      <Separator />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
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
      <Separator />
      <p className="text-muted-foreground py-5 text-center text-xs">
        © {new Date().getFullYear()} Aliko Event
      </p>
    </footer>
  );
}
