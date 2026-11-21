import Link from "next/link";

import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Brand />
          <p className="text-muted-foreground max-w-sm text-sm">
            Des invitations numériques élégantes pour tous vos événements.
          </p>
        </div>
        <nav className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/modeles" className="hover:text-foreground">Modèles</Link>
          <Link href="/#tarifs" className="hover:text-foreground">Tarifs</Link>
          <Link href="/#faq" className="hover:text-foreground">Questions fréquentes</Link>
          <Link href="/connexion" className="hover:text-foreground">Connexion</Link>
        </nav>
      </div>
      <div className="text-muted-foreground border-t py-4 text-center text-xs">
        © {new Date().getFullYear()} Aliko Event. Tous droits réservés.
      </div>
    </footer>
  );
}
