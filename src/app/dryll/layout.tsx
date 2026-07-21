import type { Metadata } from "next";
import { Commissioner } from "next/font/google";

const commissioner = Commissioner({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The World's Biggest Ad — DRYLL × Pierre Biege",
  description:
    "Der DRYLL-Schriftzug als gigantisches Strava-Artwork quer über die Schweiz: 1'079 km, +28'000 hm, 5 Buchstaben. Internes Kampagnen-Konzept.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "The World's Biggest Ad — DRYLL × Pierre Biege",
    description: "1'079 km. +28'000 hm. 5 Buchstaben. Die grösste erlaufene Werbung der Welt.",
    locale: "de_CH",
    type: "website",
  },
};

export default function DryllLayout({ children }: { children: React.ReactNode }) {
  return <div className={commissioner.className}>{children}</div>;
}
