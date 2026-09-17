import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { EVENT } from "./event";
import "./brig-ultra.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const beschreibung = `${EVENT.datumKurz} in ${EVENT.ort}: 50 Kilometer in zehn Stunden. Alle 30 Minuten eine Runde von 2,5 km, jede Stunde eine Challenge im Stadtfitness. Kostenlos, für alle — eine Runde reicht.`;

/* Die Seite lebt auf der eigenen Domain. laeuft.ch/brig-ultra bleibt als
   alter Link erreichbar, zeigt aber auf 50kmbrig.ch als Original. */
const HEIMAT = `https://${EVENT.domain}`;

export const metadata: Metadata = {
  metadataBase: new URL(HEIMAT),
  title: `${EVENT.nameLaut} — ${EVENT.gattung}`,
  authors: [{ name: EVENT.absender }],
  description: beschreibung,
  keywords: [
    "50 km Brig",
    "Ultramarathon Wallis",
    "Laufevent Brig",
    "Community Lauf Oberwallis",
    "Stadtfitness Brig",
    "erster Ultra",
    "Pierre Biege",
  ],
  alternates: { canonical: "/" },
  /* Solange Teilnehmerzahl und DRYLL-Stand nicht bestätigt sind, soll die
     Seite nicht in der Suche auftauchen. Vor dem offiziellen Start diesen
     Block löschen — dann indexiert Google sie normal. */
  robots: { index: false, follow: false },
  openGraph: {
    title: `${EVENT.nameLaut} — ${EVENT.claim} ${EVENT.claimZwei}`,
    description: beschreibung,
    url: HEIMAT,
    siteName: EVENT.nameLaut,
    locale: "de_CH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${EVENT.nameLaut} — ${EVENT.gattung}`,
    description: beschreibung,
  },
};

export default function BrigUltraLayout({ children }: { children: React.ReactNode }) {
  return <div className={`bru ${archivo.variable}`}>{children}</div>;
}
