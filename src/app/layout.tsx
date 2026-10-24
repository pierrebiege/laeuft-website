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
  title: "Läuft. | Pierre Biege baut Apps und Websites",
  description: "Eigene Apps, Konzept-Websites und Plattformen für Gemeinden. Gebaut von Pierre Biege mit KI-Agenten, in Albinen im Wallis.",
  keywords: ["Apps", "Websites", "Agentic Coding", "KI-Agenten", "Gemeinde-Website", "Wallis", "Albinen", "Pierre Biege"],
  openGraph: {
    title: "Läuft. | Pierre Biege baut Apps und Websites",
    description: "Eigene Apps, Konzept-Websites und Plattformen für Gemeinden. Gebaut mit KI-Agenten, in Albinen im Wallis.",
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
