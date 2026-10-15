import type { Metadata } from "next";
import Overlay from "../Overlay";

export const metadata: Metadata = {
  title: "OBS plus",
  robots: { index: false, follow: false },
};

/** Zweite OBS-Ebene: Namensliste vor der Glocke und Ausgeschieden-Einblendung. */
export default function ObsPlusPage() {
  return (
    <>
      <style>{`
        html, body, .byd { background: transparent !important; }
        .byd > header, .byd > footer, .byd > nav { display: none !important; }
      `}</style>
      <Overlay part="plus" />
    </>
  );
}
