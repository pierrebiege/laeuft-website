import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pierre Biege × Garmin — Aus den Walliser Alpen",
  description: "Ultraläufer, Content Creator und Abenteurer aus dem Wallis. Täglich unterwegs, auf dem Weg zum Swiss Alps 100 Rekord und einem Backyard-Aufbau bis 2035. Das Partnerschafts-Konzept für Garmin.",
  openGraph: {
    title: "Pierre Biege × Garmin — Aus den Walliser Alpen",
    description: "Ultraläufer & Abenteurer aus dem Wallis. Der lange Weg: Swiss Alps 100, 1000-km-Projekte, 100'000 Höhenmeter, Backyard bis 2035.",
    locale: "de_CH",
    type: "website",
  },
};

export default function GarminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
