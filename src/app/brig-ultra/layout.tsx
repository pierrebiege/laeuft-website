import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import { EVENT, FOTO } from "./event";
import "./brig-ultra.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

/* Anton als Display-Schrift: schmal, fett, versal — dieselbe Familie von
   Formen wie Pierres eigenes Lettering auf den Bildern. */
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
});

const titel = `50 km Brig — Ultra Community Run am 4. Oktober 2026`;

const beschreibung =
  "50 km Brig am Sonntag, 4. Oktober 2026: 50 Kilometer in zehn Stunden, aufgeteilt auf 20 Runden à 2,5 km durch Brig. Alle 30 Minuten ein Start, dazwischen eine Challenge im Stadtfitness Brig. Kostenlos, ohne Lauferfahrung — eine Runde reicht. Jetzt gratis anmelden.";

/* Die Seite lebt auf der eigenen Domain. */
const HEIMAT = `https://${EVENT.domain}`;

export const metadata: Metadata = {
  metadataBase: new URL(HEIMAT),
  title: {
    default: titel,
    template: "%s · 50 km Brig",
  },
  description: beschreibung,
  applicationName: EVENT.nameLaut,
  authors: [
    { name: "Pierre Biege", url: "https://www.natural-athletics.ch" },
    { name: "Stadtfitness Brig", url: "https://www.stadtfitness.ch" },
  ],
  creator: "Pierre Biege",
  publisher: "Pierre Biege",
  category: "Sport",
  keywords: [
    "50 km Brig",
    "Ultra Community Run",
    "Laufevent Brig",
    "Laufevent Wallis",
    "Ultramarathon Wallis",
    "Ultralauf Oberwallis",
    "Community Run Brig",
    "Stadtfitness Brig",
    "erster Ultramarathon",
    "50 Kilometer laufen",
    "Laufen Brig-Glis",
    "Pierre Biege",
    "Natural Athletics Brig",
    "Lauftreff Oberwallis",
    "Event Brig Oktober 2026",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "de_CH",
    url: HEIMAT,
    siteName: EVENT.nameLaut,
    title: `50 KM BRIG — Ultra Community Run · ${EVENT.datumKurz}`,
    description: beschreibung,
    images: [
      {
        url: "/brig-ultra/opengraph-image",
        width: 1200,
        height: 630,
        alt: `50 KM BRIG — Ultra Community Run, ${EVENT.zeile}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `50 KM BRIG — Ultra Community Run · ${EVENT.datumKurz}`,
    description: beschreibung,
    images: ["/brig-ultra/opengraph-image"],
  },
  other: {
    /* WhatsApp und Signal lesen diese beiden mit, wenn sie die Vorschau
       bauen — ohne sie schneiden manche Clients den Titel hart ab. */
    "og:image:type": "image/png",
    "theme-color": "#000000",
  },
};

export default function BrigUltraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`bru ${archivo.variable} ${anton.variable}`}>
      {/* Das Hero-Foto ist das grösste Element der Seite und entscheidet über
          den gefühlten Ladezeitpunkt. */}
      <link rel="preload" as="image" href={FOTO.hero.src} fetchPriority="high" />
      {children}
    </div>
  );
}
