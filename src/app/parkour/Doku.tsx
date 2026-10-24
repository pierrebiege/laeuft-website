"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/* Die Doku-Ebene der Seite: alles sieht aus wie aus einem Storyboard.
   Getuschte Linien (SVG-Filter, leicht verzogen wie von Hand), Panels mit
   schrägen Kanten, Erzählkästen und Sprunglinien. Figuren zeichnen wir
   nicht: Wer springt, ist ein roter Punkt, wie auf der Karte. */

/* Drei Varianten mit anderem Seed. Im Wechsel ergeben sie die «kochende»
   Linie alter Zeichentrickfilme. Einmal pro Seite einbinden. */
export function Tusche() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      {[1, 2, 3].map((seed) => (
        <filter key={seed} id={`pk-tusche-${seed}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={seed * 7} />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
      ))}
      <filter id="pk-tusche-fein" x="-2%" y="-20%" width="104%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="3" />
      </filter>
    </svg>
  );
}

/* Ein Panel mit schrägen Seitenkanten und getuschtem Rahmen. */
export function Panel({
  children,
  className,
  kasten,
  stil,
}: {
  children?: React.ReactNode;
  className?: string;
  kasten?: React.ReactNode;
  stil?: React.CSSProperties;
}) {
  return (
    <div className={`pk-panel${className ? ` ${className}` : ""}`} style={stil}>
      <span className="pk-panel-tusche" aria-hidden="true">
        <span className="pk-panel-form" />
      </span>
      <div className="pk-panel-bild">{children}</div>
      {kasten ? <div className="pk-panel-kasten pk-kasten">{kasten}</div> : null}
    </div>
  );
}

/* Hindernisse für die Sprunglinien, als Tuschestriche. */
type Hindernis = "gelaender" | "mauer" | "luecke" | "stufen";

function HindernisStriche({ art }: { art: Hindernis }) {
  switch (art) {
    case "gelaender":
      return (
        <g className="pk-sl-hindernis">
          <path d="M420 92 H580" />
          <path d="M432 92 V150 M500 92 V150 M568 92 V150" />
          <path d="M420 112 H580" className="pk-sl-duenn" />
        </g>
      );
    case "mauer":
      return (
        <g className="pk-sl-hindernis">
          <path d="M440 150 V78 H560 V150" />
          <path d="M440 104 H560 M440 128 H560 M500 78 V104 M470 104 V128 M530 104 V128 M500 128 V150" className="pk-sl-duenn" />
        </g>
      );
    case "luecke":
      return (
        <g className="pk-sl-hindernis">
          <path d="M60 150 V118 H360 V150" />
          <path d="M640 150 V118 H940 V150" />
        </g>
      );
    case "stufen":
      return (
        <g className="pk-sl-hindernis">
          <path d="M380 150 V132 H440 V114 H500 V96 H560 V150" />
        </g>
      );
  }
}

const BOEGEN: Record<Hindernis, { pfad: string; ab: [number, number]; auf: [number, number] }> = {
  gelaender: { pfad: "M120 150 C 300 150, 380 26, 500 26 S 720 150, 880 150", ab: [120, 150], auf: [880, 150] },
  mauer: { pfad: "M140 150 C 300 150, 400 30, 500 34 S 700 150, 860 150", ab: [140, 150], auf: [860, 150] },
  luecke: { pfad: "M330 118 C 420 40, 580 40, 670 118", ab: [330, 118], auf: [670, 118] },
  stufen: { pfad: "M160 150 C 320 150, 420 40, 520 46 S 720 150, 840 150", ab: [160, 150], auf: [840, 150] },
};

/* Eine Sprunglinie zwischen zwei Abschnitten: Absprung, Bogen über ein
   Hindernis, Landung. Der Bogen zeichnet sich beim Scrollen. */
export function Sprunglinie({ art = "gelaender", spiegeln = false }: { art?: Hindernis; spiegeln?: boolean }) {
  const ruhig = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "end 40%"] });
  const laenge = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const landung = useTransform(scrollYProgress, [0.85, 1], [0, 1]);
  const b = BOEGEN[art];
  return (
    <div ref={ref} className={`pk-sl${spiegeln ? " pk-sl-spiegeln" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 1000 170" preserveAspectRatio="xMidYMid meet">
        <g className="pk-sl-tusche">
          {art !== "luecke" && <path d="M40 150 H960" className="pk-sl-boden" />}
          <HindernisStriche art={art} />
          <path d={`M${b.ab[0] - 14} ${b.ab[1] + 9} l 14 -9 l 14 9`} className="pk-sl-marke" />
        </g>
        <motion.path
          d={b.pfad}
          className="pk-sl-bogen"
          style={ruhig ? undefined : { pathLength: laenge }}
        />
        <motion.circle
          cx={b.auf[0]}
          cy={b.auf[1] - 9}
          r="9"
          className="pk-sl-punkt"
          style={ruhig ? undefined : { opacity: landung, scale: landung }}
        />
      </svg>
    </div>
  );
}

/* Der Moment, mit dem in der Schweiz alles anfängt: ein paar Sekunden
   Fernsehen, einer springt über ein Geländer. Als 4:3-Bild mit Timecode. */
export function FernsehMoment({ kasten, zeile }: { kasten: string; zeile: string }) {
  return (
    <figure className="pk-tv">
      <Panel className="pk-tv-panel" kasten={<strong>{kasten}</strong>}>
        <svg viewBox="0 0 400 300" className="pk-tv-svg" role="img" aria-label={zeile}>
          <g className="pk-tv-tusche">
            <path d="M0 236 H400" />
            <path d="M118 176 H282" />
            <path d="M128 176 V236 M200 176 V236 M272 176 V236" />
            <path d="M118 196 H282" className="pk-tv-duenn" />
            <path d="M24 250 H90 M310 252 H380 M150 262 H250" className="pk-tv-duenn" />
          </g>
          <path id="pk-tv-bahn" d="M40 228 C 110 228, 150 108, 200 108 S 300 228, 360 228" className="pk-tv-bahn" />
          <circle r="9" className="pk-tv-punkt pk-tv-punkt-lauf">
            <animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.7;1" calcMode="linear">
              <mpath href="#pk-tv-bahn" />
            </animateMotion>
          </circle>
          <circle cx="200" cy="108" r="9" className="pk-tv-punkt pk-tv-punkt-still" />
          <text x="384" y="34" textAnchor="end" className="pk-tv-tc">
            00:00:05:00
          </text>
        </svg>
      </Panel>
      <figcaption className="pk-tv-zeile">{zeile}</figcaption>
    </figure>
  );
}

/* Das Kapitelband: der Film als Folge von Panels. */
export type Kapitel = { nummer: string; jahre: string; titel: string; text: string };

export function Kapitelband({ kapitel }: { kapitel: Kapitel[] }) {
  const ruhig = useReducedMotion();
  return (
    <ol className="pk-kap">
      {kapitel.map((k, i) => (
        <motion.li
          key={k.titel}
          className="pk-kap-eintrag"
          initial={ruhig ? false : { opacity: 0, y: 40, rotate: i % 2 ? 1.2 : -1.2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: (i % 4) * 0.06 }}
        >
          <Panel
            className={`pk-kap-panel pk-kap-ton-${i % 3}`}
            kasten={
              <>
                <strong>{k.nummer}</strong>
                <small>{k.jahre}</small>
              </>
            }
          >
            <div className="pk-kap-inhalt">
              <h3 className="pk-kap-titel">{k.titel}</h3>
              <p className="pk-kap-text">{k.text}</p>
            </div>
          </Panel>
        </motion.li>
      ))}
    </ol>
  );
}

/* Dieselbe Frage, zwei Generationen, gleicher Bildausschnitt. */
export function SchnittAnSchnitt({
  frage,
  links,
  rechts,
  schnitt,
}: {
  frage: string;
  links: string;
  rechts: string;
  schnitt: string;
}) {
  return (
    <div className="pk-sas" aria-label={`${frage} ${links}, ${rechts}`}>
      {[links, rechts].map((unter, i) => (
        <figure key={unter} className={`pk-sas-bild pk-sas-${i ? "neu" : "alt"}`}>
          <Panel className="pk-sas-panel">
            <svg viewBox="0 0 400 300" className="pk-sas-svg" aria-hidden="true">
              <g className="pk-sas-raster">
                <path d="M133 0 V300 M267 0 V300 M0 100 H400 M0 200 H400" />
              </g>
              <g className="pk-sas-ecken">
                <path d="M24 44 V24 H44 M356 24 H376 V44 M376 256 V276 H356 M44 276 H24 V256" />
              </g>
              <circle cx="267" cy="100" r="8" className="pk-sas-punkt" />
            </svg>
            <div className="pk-blase">
              <p>{frage}</p>
            </div>
          </Panel>
          <figcaption>{unter}</figcaption>
        </figure>
      ))}
      <span className="pk-sas-schnitt">{schnitt}</span>
    </div>
  );
}
