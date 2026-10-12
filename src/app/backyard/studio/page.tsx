import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import Studio from "@/app/backyard/_components/studio/Studio";
import { studioAccess } from "@/app/backyard/_lib/studio-access";
import "./studio.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["500", "700", "800", "900"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

/**
 * Grafiken über Fotos und Videos fürs Rennwochenende. Nur über einen
 * geheimen Link erreichbar (?k=…, siehe _lib/studio-access.ts).
 */
export default async function StudioPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;
  const access = studioAccess(k);
  if (!access || !k) notFound();
  return (
    <div className={`${inter.variable} ${mono.variable}`}>
      <Studio access={access} k={k} />
    </div>
  );
}
