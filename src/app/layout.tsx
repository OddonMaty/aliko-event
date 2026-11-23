import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond, Montserrat } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieNotice } from "@/components/cookie-notice";
import { Toaster } from "@/components/ui/sonner";
import { isTestPayments } from "@/lib/testmode";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Aliko Event — Invitations numériques élégantes", template: "%s — Aliko Event" },
  description:
    "Choisissez un design, personnalisez votre invitation numérique, recevez votre lien et votre QR code. Mariage, anniversaire, baby shower, conférence et plus.",
  openGraph: { type: "website", siteName: "Aliko Event", locale: "fr_FR" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0a" },
    { media: "(prefers-color-scheme: light)", color: "#fbf8f1" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${cormorant.variable} ${montserrat.variable}`}
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {isTestPayments() && (
            <div className="bg-primary text-primary-foreground px-4 py-1 text-center text-xs font-medium tracking-wide">
              MODE TEST · les paiements sont simulés, aucun argent réel
            </div>
          )}
          {children}
          <CookieNotice />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
