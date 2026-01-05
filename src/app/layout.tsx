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
  title: "Läuft. | Alles für KMU. Aus einer Hand.",
  description: "Web, Branding, Social Media, Automatisierung – ein Abo, ein Ansprechpartner. Pausieren oder kündigen jederzeit.",
  keywords: ["KMU", "Webdesign", "Branding", "Social Media", "Automatisierung", "Schweiz", "Wallis"],
  openGraph: {
    title: "Läuft. | Alles für KMU. Aus einer Hand.",
    description: "Web, Branding, Social Media, Automatisierung – ein Abo, ein Ansprechpartner.",
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
