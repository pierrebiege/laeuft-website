import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pierre Biege × Ford — Partnerschaft 2026",
  description: "Ready. Set. Ford. Ultraläufer, Fotograf und Content Creator aus den Alpen. Abenteuer statt Alltag – das Partnerschafts-Konzept für Ford.",
  openGraph: {
    title: "Pierre Biege × Ford — Partnerschaft 2026",
    description: "Ready. Set. Ford. Abenteuer statt Alltag – das Partnerschafts-Konzept.",
    locale: "de_CH",
    type: "website",
  },
};

export default function FordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
