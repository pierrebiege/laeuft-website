"use client";

import { animate, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import KarteSvg from "./KarteSvg";
import { ORTE } from "./karte-daten";
import { SPRUNG } from "./Bewegung";
import type { TitelZeile } from "./titel";
import { ZUSATZ } from "./texte-zusatz";
import type { Sprache } from "./texte";

/* Erster Bildschirm. Riesiger Titel, dessen Zeilen gegeneinander versetzt
   stehen und beim Scrollen auseinanderlaufen. Rechts ein Bildfenster, das
   über den Rand hinausläuft: später ein stummer Loop aus altem Material
   (`videoSrc`), bis dahin die Karte, auf der die Orte in der Reihenfolge
   ihrer Jahre aufspringen, mit mitlaufender Jahreszahl. */

const START = 2000;
const ENDE = 2026;
const VORLAUF = 0.7; // Sekunden, bis die Karte zu laufen beginnt
const LAUF = 2.6; // Sekunden für 2000 bis 2026

type Props = {
  zeilen: TitelZeile[];
  unter: React.ReactNode;
  bildLabel: string;
  sprache: Sprache;
  videoSrc?: string;
  videoPoster?: string;
  moment?: React.ReactNode;
};

export default function Hero({ zeilen, unter, bildLabel, sprache, videoSrc, videoPoster, moment }: Props) {
  const orteText = ZUSATZ[sprache].karte.orte;
  const ruhig = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const links = useTransform(scrollYProgress, [0, 1], ["0vw", "-14vw"]);
  const rechts = useTransform(scrollYProgress, [0, 1], ["0vw", "16vw"]);
  const bildY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const bildZoom = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

  return (
    <section id="oben" ref={ref} className="pk-hero">
      <motion.div
        className="pk-hero-bild"
        style={ruhig ? undefined : { y: bildY }}
        initial={ruhig ? false : { clipPath: "inset(0 0 0 100%)" }}
        animate={{ clipPath: "inset(0 0 0 0%)" }}
        transition={{ duration: 1.1, ease: SPRUNG, delay: 0.15 }}
      >
        <motion.div className="pk-hero-bild-innen" style={ruhig ? undefined : { scale: bildZoom }}>
          {videoSrc ? (
            <video
              className="pk-hero-video"
              src={videoSrc}
              poster={videoPoster}
              autoPlay={!ruhig}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          ) : (
            <KarteStandbild ruhig={!!ruhig} label={bildLabel} />
          )}
        </motion.div>
        {!videoSrc && <JahrLauf ruhig={!!ruhig} orteText={orteText} />}
        <span className="pk-hero-tusche" aria-hidden="true" />
      </motion.div>

      {moment && (
        <motion.div
          className="pk-hero-moment"
          initial={ruhig ? false : { opacity: 0, y: 40, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.9, ease: SPRUNG, delay: 0.9 }}
        >
          {moment}
        </motion.div>
      )}

      <div className="pk-rahmen pk-hero-innen">
        <h1 className="pk-h1" aria-label={zeilen.map((z) => (z.klein ? `${z.klein} ${z.gross}` : z.gross)).join(" ")}>
          {zeilen.map((z, i) => (
            <motion.span
              key={i}
              className={`pk-h1-zeile pk-h1-zeile-${i}`}
              aria-hidden="true"
              style={ruhig ? undefined : { x: i % 2 ? rechts : links }}
            >
              {z.klein && (
                <span className="pk-h1-kante pk-h1-klein-kante">
                  <motion.span
                    className="pk-h1-klein"
                    initial={ruhig ? false : { y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.8, ease: SPRUNG, delay: 0.35 + i * 0.12 }}
                  >
                    {z.klein}
                  </motion.span>
                </span>
              )}
              <span className="pk-h1-kante">
                <motion.span
                  className="pk-h1-gross"
                  initial={ruhig ? false : { y: "104%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 1, ease: SPRUNG, delay: 0.1 + i * 0.12 }}
                >
                  {z.gross}
                </motion.span>
              </span>
            </motion.span>
          ))}
        </h1>

        <motion.div
          className="pk-hero-unten"
          initial={ruhig ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: SPRUNG, delay: 0.55 }}
        >
          {unter}
        </motion.div>
      </div>
    </section>
  );
}

/* Ohne Video: die Karte, nah herangezoomt, Punkte springen chronologisch auf. */
function KarteStandbild({ ruhig, label }: { ruhig: boolean; label: string }) {
  return (
    <KarteSvg
      beschriften={false}
      hervorheben={false}
      className="pk-hero-svg"
      titel={label}
      zuschnitt
      ausschnitt={[120, 40, 600, 600]}
      verzoegerung={ruhig ? undefined : (jahr) => VORLAUF + ((jahr - START) / (ENDE - START)) * LAUF}
    />
  );
}

/* Die Jahreszahl im Bildfenster läuft synchron zu den Punkten mit. */
function JahrLauf({ ruhig, orteText }: { ruhig: boolean; orteText: (n: number) => string }) {
  const [jahr, setJahr] = useState(START);
  useEffect(() => {
    if (ruhig) return;
    const s = animate(START, ENDE, {
      duration: LAUF,
      delay: VORLAUF,
      ease: "linear",
      onUpdate: (v) => setJahr(Math.floor(v)),
    });
    return () => s.stop();
  }, [ruhig]);
  const n = ORTE.filter((o) => o.jahr <= jahr).length;
  return (
    <div className="pk-hero-lauf" aria-hidden="true">
      <span className="pk-hero-lauf-jahr">{ruhig ? ENDE : jahr}</span>
      <span className="pk-hero-lauf-orte">{orteText(ruhig ? ORTE.length : n)}</span>
    </div>
  );
}
