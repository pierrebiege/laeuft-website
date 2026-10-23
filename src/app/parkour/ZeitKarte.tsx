"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import KarteSvg from "./KarteSvg";
import { ORTE } from "./karte-daten";
import { TEXTE, type Sprache } from "./texte";

/* Die Karte, die beim Scrollen 25 Jahre durchläuft. Der Abschnitt ist
   mehrere Bildschirme hoch, innen klebt ein Bildschirm fest; die
   Scroll-Position wird in ein Jahr zwischen 2000 und 2026 übersetzt.
   Wer reduzierte Bewegung eingestellt hat, sieht direkt den Stand 2026. */

const START = 2000;
const ENDE = 2026;
const MQ = "(prefers-reduced-motion: reduce)";
function abonnieren(melden: () => void) {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", melden);
  return () => mq.removeEventListener("change", melden);
}
const JAHRE = Array.from({ length: ENDE - START + 1 }, (_, i) => START + i);

export default function ZeitKarte({ sprache }: { sprache: Sprache }) {
  const t = TEXTE[sprache];
  const abschnitt = useRef<HTMLElement>(null);
  const [scrollJahr, setJahr] = useState(START);
  const ruhig = useSyncExternalStore(abonnieren, () => window.matchMedia(MQ).matches, () => false);
  const jahr = ruhig ? ENDE : scrollJahr;

  useEffect(() => {
    if (ruhig) return;
    let bild = 0;
    const messen = () => {
      bild = 0;
      const el = abschnitt.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const weg = r.height - window.innerHeight;
      const p = weg > 0 ? Math.min(1, Math.max(0, -r.top / weg)) : 1;
      /* Die ersten 4 % stehen auf 2000, die letzten 10 % auf 2026, damit
         Anfang und Ende kurz stehen bleiben. */
      const q = Math.min(1, Math.max(0, (p - 0.04) / 0.86));
      setJahr(START + Math.round(q * (ENDE - START)));
    };
    const beiScroll = () => {
      if (!bild) bild = requestAnimationFrame(messen);
    };
    messen();
    window.addEventListener("scroll", beiScroll, { passive: true });
    window.addEventListener("resize", beiScroll);
    return () => {
      window.removeEventListener("scroll", beiScroll);
      window.removeEventListener("resize", beiScroll);
      if (bild) cancelAnimationFrame(bild);
    };
  }, [ruhig]);

  const epoche = t.karte.epochen.find((e) => jahr >= e.von && jahr <= e.bis) ?? t.karte.epochen[0];
  const neu = ORTE.filter((o) => o.jahr === jahr).map((o) => t.karte.ortsnamen[o.name] ?? o.name);
  const anteil = (jahr - START) / (ENDE - START);

  return (
    <section
      id="karte"
      ref={abschnitt}
      className={ruhig ? "pk-zeit pk-zeit-ruhig" : "pk-zeit"}
      aria-label={t.nav.karte}
    >
      <div className="pk-zeit-buehne">
        <div className="pk-zeit-text">
          <p className="pk-zeit-jahr" aria-live="polite">
            {jahr}
          </p>
          <p className="pk-zeit-orte">{neu.length ? neu.join(", ") : jahr < 2005 ? t.karte.keinePunkte : " "}</p>
          {ruhig ? (
            t.karte.epochen.map((e) => (
              <p key={e.von} className="pk-zeit-epoche">
                {e.von}–{e.bis}: {e.text}
              </p>
            ))
          ) : (
            <p key={epoche.von} className="pk-zeit-epoche">
              {epoche.text}
            </p>
          )}
        </div>
        <div className="pk-zeit-karte">
          <KarteSvg jahr={jahr} ortsnamen={t.karte.ortsnamen} className="pk-karte-svg" titel={t.nav.karte} />
          <div className="pk-achse" role="img" aria-label={t.karte.zeitachse}>
            <div className="pk-achse-linie">
              <div className="pk-achse-fuellung" style={{ transform: `scaleX(${anteil})` }} />
              {JAHRE.map((j) => (
                <span
                  key={j}
                  className={j <= jahr ? "pk-achse-strich pk-achse-strich-an" : "pk-achse-strich"}
                  style={{ left: `${((j - START) / (ENDE - START)) * 100}%` }}
                />
              ))}
            </div>
            <div className="pk-achse-zahlen">
              <span>2000</span>
              <span>2013</span>
              <span>2026</span>
            </div>
          </div>
          <p className="pk-zeit-legende">{t.karte.legende}</p>
        </div>
      </div>
    </section>
  );
}
