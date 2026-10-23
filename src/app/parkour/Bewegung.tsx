"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* Kleine Bausteine für Bewegung mit Sinn. Alles respektiert
   prefers-reduced-motion: dann steht der Endzustand sofort da. */

export const SPRUNG = [0.16, 1, 0.3, 1] as const;

/* Ein Block schiebt sich beim ersten Sichtkontakt von unten ins Bild. */
export function Auftritt({
  children,
  className,
  verzoegerung = 0,
  versatz = 48,
  als = "div",
}: {
  children: React.ReactNode;
  className?: string;
  verzoegerung?: number;
  versatz?: number;
  als?: "div" | "p" | "figure";
}) {
  const ruhig = useReducedMotion();
  const Teil = motion[als];
  if (ruhig) {
    const Statisch = als;
    return <Statisch className={className}>{children}</Statisch>;
  }
  return (
    <Teil
      className={className}
      initial={{ opacity: 0, y: versatz }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: SPRUNG, delay: verzoegerung }}
    >
      {children}
    </Teil>
  );
}

/* Grosse Überschrift: jede Zeile taucht aus einer Kante auf, wie über eine
   Mauer. `zeilen` sind die sichtbaren Zeilen, für Screenreader zählt der
   ganze Satz. */
export function Kante({
  zeilen,
  className,
  als = "h2",
  id,
}: {
  zeilen: string[];
  className?: string;
  als?: "h2" | "p";
  id?: string;
}) {
  const ruhig = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const sichtbar = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const Tag = als;
  return (
    <Tag ref={ref} id={id} className={className} aria-label={zeilen.join(" ")}>
      {zeilen.map((z, i) => (
        <span key={i} className="pk-kante" aria-hidden="true">
          <motion.span
            className="pk-kante-innen"
            initial={ruhig ? false : { y: "108%" }}
            animate={ruhig || sichtbar ? { y: "0%" } : { y: "108%" }}
            transition={{ duration: 0.85, ease: SPRUNG, delay: i * 0.09 }}
          >
            {z}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* Eine Zahl zählt hoch, sobald sie ins Bild kommt. */
export function Zaehler({ bis, von = 0, dauer = 1.6, className }: { bis: number; von?: number; dauer?: number; className?: string }) {
  const ruhig = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const sichtbar = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [wert, setWert] = useState(von);

  useEffect(() => {
    if (!sichtbar || ruhig) return;
    const steuerung = animate(von, bis, {
      duration: dauer,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setWert(Math.round(v)),
    });
    return () => steuerung.stop();
  }, [sichtbar, ruhig, von, bis, dauer]);

  return (
    <span ref={ref} className={className}>
      {ruhig ? bis : wert}
    </span>
  );
}
