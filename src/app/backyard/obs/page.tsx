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
 * Parameter:
 *   ?year=2024       Testlauf mit den Zahlen von 2024
 *   ?left=12         Läufer im Rennen von Hand setzen (falls der Feed fehlt)
 *   ?lap=23          Runde von Hand setzen
 *   ?pos=right       Block unten rechts statt unten links
 */
export default function ObsPage() {
  return (
    <>
      <style>{`
        html, body, .byd { background: transparent !important; }
        .byd > header, .byd > footer, .byd > nav { display: none !important; }
      `}</style>
      <Overlay />
    </>
  );
}
