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
    default: "Team Switzerland · Backyard Ultra World Team Championship 2026",
    template: "%s · Team Switzerland Backyard",
  },
  description:
    "Fifteen runners, one 6706 metre loop every hour, until nobody can. 17 October 2026, Baar ZG. Live loop count and world standings.",
  openGraph: {
    title: "Team Switzerland · Backyard Ultra World Team Championship 2026",
    description: "17 October 2026, 14:00, Baar ZG. One loop every hour.",
    locale: "en",
    type: "website",
  },
};

export default function BackyardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en" className={`byd ${archivo.variable}`}>
      <Chrome />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
