import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Joe Nimble — Social Media, Content & Partnerships",
  description:
    "Konzept für Joe Nimble: Brand, Science, Proof. Social Media, Community, Athleten- und Influencer-Netzwerk, Content-Produktion. Von Anes und Pierre Biege.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Joe Nimble — Social Media, Content & Partnerships",
    description: "Build the identity. Create the proof. Grow the community.",
    locale: "de_CH",
    type: "website",
  },
};

export default function JoeNimbleSocialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
