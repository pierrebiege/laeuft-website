import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Läuft. | Betriebssystem für KMU",
  description: "Wir machen euren Betrieb schneller. Keine Beratung. Keine Workshops. Direkte Umsetzung.",
  keywords: ["KMU", "Automatisierung", "Betrieb", "Schweiz", "Wallis", "Effizienz"],
  openGraph: {
    title: "Läuft. | Betriebssystem für KMU",
    description: "Wir machen euren Betrieb schneller. Punkt.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
