import type { Metadata } from "next";
import Overlay from "./Overlay";

export const metadata: Metadata = {
  title: "OBS",
  robots: { index: false, follow: false },
};

/**
 * Einblendung für den Livestream (OBS → Quelle «Browser», 1920 × 1080).
 * Hintergrund durchsichtig, Kopf- und Fusszeile der Seite ausgeblendet.
 *
 * Zweite Ebene mit Namen und Ausgeschieden: /obs/plus. Parameter siehe Overlay.tsx.
 */
export default function ObsPage() {
  return (
    <>
      <style>{`
        html, body, .byd { background: transparent !important; }
        .byd > header, .byd > footer, .byd > nav { display: none !important; }
      `}</style>
      <Overlay part="bar" />
    </>
  );
}
