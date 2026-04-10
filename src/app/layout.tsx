import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Läuft. | Websites, AI-Integration & digitale Systeme",
  description: "Moderne Websites, KI-Integration und digitale Systeme für Schweizer Unternehmen. Wir optimieren Prozesse, automatisieren Workflows und bringen dein Business auf das nächste Level.",
  keywords: ["Webdesign", "AI-Integration", "KI", "digitale Systeme", "Automatisierung", "Schweiz", "Wallis", "Websites", "Chatbot", "CRM"],
  openGraph: {
    title: "Läuft. | Websites, AI-Integration & digitale Systeme",
    description: "Moderne Websites, KI-Integration und digitale Systeme für Schweizer Unternehmen. Prozesse optimieren, Workflows automatisieren.",
    locale: "de_CH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
