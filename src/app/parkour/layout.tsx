import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./parkour.css";

/* Archivo als variable Schrift mit Breitenachse: schmal und schwer für die
   Titel, normal breit für den Text. Eine Familie, kein Serifen-Akzent. */
const archivo = Archivo({
  variable: "--pk-schrift",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

/* Schreibmaschine für Erzählkästen und Timecodes, wie im Drehbuch. */
const mono = IBM_Plex_Mono({
  variable: "--pk-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://laeuft.ch"),
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f3f2ee",
};

export default function ParkourLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${archivo.variable} ${mono.variable}`}>{children}</div>;
}
