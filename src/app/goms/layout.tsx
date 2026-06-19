import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ultra durchs Goms zum Gletscher — Pierre Biege × Goms Tourismus",
  description: "Ein Ultra durch das Goms an einem Tag: 60 km, 4'500 hm, vom ersten Licht bis zur Quelle des Rotten am Rhonegletscher. Ein Video-Konzept für Goms Tourismus.",
  openGraph: {
    title: "Ultra durchs Goms zum Gletscher",
    description: "60 km, 4'500 hm, an einem Tag – vom ersten Licht bis zum Gletscher. Video-Konzept für Goms Tourismus.",
    locale: "de_CH",
    type: "website",
  },
};

export default function GomsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
