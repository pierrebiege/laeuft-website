"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Kinder erscheinen gestaffelt, sobald der Block ins Bild kommt.
 *
 * Wichtig: Das Ausblenden setzt erst dieses JavaScript (`reveal-armed`).
 * Vorher stand `opacity: 0` fest im CSS – auf einer langsamen Verbindung
 * war die Seite dann so lange grösstenteils leer, bis das Bundle da war,
 * obwohl der ganze Text schon im ersten Byte-Paket lag.
 */
export default function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Wer keine Bewegung will, bekommt den Inhalt ohne Umweg.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.classList.add("reveal-armed");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
