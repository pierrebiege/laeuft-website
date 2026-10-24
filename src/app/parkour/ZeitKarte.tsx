"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import KarteSvg from "./KarteSvg";
import { ORTE } from "./karte-daten";
import { TEXTE, type Sprache } from "./texte";
import { ZUSATZ } from "./texte-zusatz";
import { SPRUNG } from "./Bewegung";

/* Die Karte, die beim Scrollen 25 Jahre durchläuft. Der Abschnitt ist
   mehrere Bildschirme hoch, innen klebt ein Bildschirm fest; die
   Scroll-Position wird in ein Jahr zwischen 2000 und 2026 übersetzt.
   Die Jahreszahl rollt Ziffer für Ziffer, neue Orte springen mit einem
   Ring auf, der Zähler der Orte läuft mit.
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
  const z = ZUSATZ[sprache];
  const abschnitt = useRef<HTMLElement>(null);
  const [scrollJahr, setJahr] = useState(START);
  const ruhig = useSyncExternalStore(abonnieren, () => window.matchMedia(MQ).matches, () => false);
  const jahr = ruhig ? ENDE : scrollJahr;
  /* Rollrichtung der Ziffern: vorwärts nach oben, rückwärts nach unten. */
  const [vorher, setVorher] = useState(jahr);
  const [richtung, setRichtung] = useState(1);
  if (vorher !== jahr) {
    setRichtung(jahr > vorher ? 1 : -1);
    setVorher(jahr);
  }

  /* Beim Hereinscrollen zieht die Karte von leicht klein auf volle Grösse. */
  const { scrollYProgress: rein } = useScroll({ target: abschnitt, offset: ["start end", "start start"] });
  const kartenZoom = useTransform(rein, [0, 1], [0.86, 1]);
  const kartenX = useTransform(rein, [0, 1], ["8%", "0%"]);

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
  const anzahl = ORTE.filter((o) => o.jahr <= jahr).length;
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
          <p className="pk-zeit-jahr" aria-live="polite" aria-label={String(jahr)}>
            {String(jahr)
              .split("")
              .map((ziffer, i) => (
                <span key={i} className="pk-ziffer" aria-hidden="true">
                  <AnimatePresence initial={false} custom={richtung} mode="popLayout">
                    <motion.span
                      key={ziffer}
                      custom={richtung}
                      className="pk-ziffer-innen"
                      variants={{
                        rein: (r: number) => ({ y: `${r * 100}%` }),
                        da: { y: "0%" },
                        raus: (r: number) => ({ y: `${r * -100}%` }),
                      }}
                      initial="rein"
                      animate="da"
                      exit="raus"
                      transition={{ duration: 0.38, ease: SPRUNG }}
                    >
                      {ziffer}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ))}
          </p>
          <p className="pk-zeit-zahl">
            <span className="pk-zeit-anzahl">{z.karte.orte(anzahl)}</span>
            <span className="pk-zeit-orte">{neu.length ? `+ ${neu.join(", ")}` : anzahl === 0 ? t.karte.keinePunkte : " "}</span>
          </p>
          {ruhig ? (
            t.karte.epochen.map((e) => (
              <p key={e.von} className="pk-zeit-epoche">
                {e.von}–{e.bis}: {e.text}
              </p>
            ))
          ) : (
            <div className="pk-zeit-epoche-rahmen">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={epoche.von}
                  className="pk-zeit-epoche"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: SPRUNG }}
                >
                  <span className="pk-zeit-epoche-jahre">
                    {epoche.von}–{epoche.bis}
                  </span>
                  {epoche.text}
                </motion.p>
              </AnimatePresence>
            </div>
          )}
        </div>
        <motion.div className="pk-zeit-karte" style={ruhig ? undefined : { scale: kartenZoom, x: kartenX }}>
          <KarteSvg jahr={jahr} ortsnamen={t.karte.ortsnamen} className="pk-karte-svg" titel={t.nav.karte} />
          <div className="pk-achse" role="img" aria-label={t.karte.zeitachse}>
            <div className="pk-achse-linie">
              {t.karte.epochen.map((e) => (
                <span
                  key={e.von}
                  className={jahr >= e.von && jahr <= e.bis ? "pk-achse-epoche pk-achse-epoche-an" : "pk-achse-epoche"}
                  style={{
                    left: `${((e.von - START) / (ENDE - START)) * 100}%`,
                    width: `${((Math.min(e.bis + 1, ENDE) - e.von) / (ENDE - START)) * 100}%`,
                  }}
                />
              ))}
              <div className="pk-achse-fuellung" style={{ transform: `scaleX(${anteil})` }} />
              {JAHRE.map((j) => (
                <span
                  key={j}
                  className={j <= jahr ? "pk-achse-strich pk-achse-strich-an" : "pk-achse-strich"}
                  style={{ left: `${((j - START) / (ENDE - START)) * 100}%` }}
                />
              ))}
              <span className="pk-achse-kopf" style={{ left: `${anteil * 100}%` }} />
            </div>
            <div className="pk-achse-zahlen">
              <span>2000</span>
              <span>2013</span>
              <span>2026</span>
            </div>
          </div>
          <p className="pk-zeit-legende">{t.karte.legende}</p>
        </motion.div>
      </div>
    </section>
  );
}
