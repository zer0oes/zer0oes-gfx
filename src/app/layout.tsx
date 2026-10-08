import type { Metadata } from "next";
import localFont from "next/font/local";
import { site } from "@/data/site";
import { DisclosureAnimations } from "@/components/DisclosureAnimations";
import "./globals.css";

// Texte courant (choix d'Aurore) : graisses utilisées par le site, normale à grasse
const body = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "./fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
});

// Titres, prix et numéros : Lexend servie localement, sans téléchargement au démarrage.
const display = localFont({
  variable: "--font-lexend",
  display: "swap",
  src: "./fonts/Lexend-Variable.ttf",
  weight: "100 900",
  style: "normal",
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  openGraph: { siteName: site.name, locale: "fr_FR", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${body.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans"><DisclosureAnimations />{children}</body>
    </html>
  );
}
