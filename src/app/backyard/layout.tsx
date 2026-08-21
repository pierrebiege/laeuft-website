import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import Chrome from "./_components/Chrome";
import Footer from "./_components/Footer";
import "./backyard.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Team Schweiz · Backyard Ultra World Team Championship 2026",
    template: "%s · Team Schweiz Backyard",
  },
  description:
    "Fünfzehn Läuferinnen und Läufer, eine Runde von 6706 Metern pro Stunde, bis niemand mehr kann. 17. Oktober 2026, Baar ZG. Live-Rundenstand und Weltstand aller Nationen.",
  openGraph: {
    title: "Team Schweiz · Backyard Ultra World Team Championship 2026",
    description: "17. Oktober 2026, 14:00, Baar ZG. Jede Stunde eine Runde.",
    locale: "de_CH",
    type: "website",
  },
};

export default function BackyardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`byd ${archivo.variable}`}>
      <Chrome />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
