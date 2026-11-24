"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, ScrollText, Settings2, ShieldAlert, SlidersHorizontal, Ticket, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/commandes", label: "Commandes", icon: Receipt },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/invitations", label: "Invitations", icon: Ticket },
  { href: "/admin/reglages", label: "Réglages", icon: SlidersHorizontal },
  { href: "/admin/moderation", label: "Modération", icon: ShieldAlert },
  { href: "/admin/journal", label: "Journal", icon: ScrollText },
  { href: "/admin/systeme", label: "Système", icon: Settings2 },
] as const;

export function AdminNav({ openReports }: { openReports: number }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav aria-label="Administration" className="no-scrollbar bg-background/90 sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-4 flex gap-1 overflow-x-auto border-b px-4 py-2 backdrop-blur lg:static lg:mx-0 lg:flex-col lg:gap-0.5 lg:border-0 lg:bg-transparent lg:p-0">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={active(href) ? "page" : undefined}
          className={cn(
            "flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm whitespace-nowrap transition-colors",
            active(href) ? "bg-primary/12 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
          {href === "/admin/moderation" && openReports > 0 && (
            <span className="bg-destructive text-destructive-foreground ml-auto rounded-full px-1.5 text-[10px] leading-4 font-semibold">{openReports}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
