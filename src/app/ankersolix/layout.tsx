import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pierre Biege × Anker SOLIX — Strom für die Geschichte",
  description: "Ultraläufer & Content Creator, tagelang off-grid in den Alpen. Wenn der Akku stirbt, stirbt die Geschichte – das Partnerschafts-Konzept für Anker SOLIX.",
  openGraph: {
    title: "Pierre Biege × Anker SOLIX — Strom für die Geschichte",
    description: "Tagelang off-grid in den Alpen. Mehrtägige Ultra-Projekte 2026, authentisch im Einsatz. Konzept für Anker SOLIX.",
    locale: "de_CH",
    type: "website",
  },
};

export default function AnkerSolixLayout({ children }: { children: React.ReactNode }) {
  return children;
}
