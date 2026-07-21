import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The World's Biggest Ad — DRYLL × Pierre Biege",
  description:
    "Der DRYLL-Schriftzug als gigantisches Strava-Artwork quer über die Schweiz: 1'078 km, +28'000 hm, 5 Buchstaben. Internes Kampagnen-Konzept.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "The World's Biggest Ad — DRYLL × Pierre Biege",
    description: "1'078 km. +28'000 hm. 5 Buchstaben. Die grösste erlaufene Werbung der Welt.",
    locale: "de_CH",
    type: "website",
  },
};

export default function DryllLayout({ children }: { children: React.ReactNode }) {
  return children;
}
