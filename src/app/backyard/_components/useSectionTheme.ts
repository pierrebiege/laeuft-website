"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type Hour = "tag" | "daemmerung" | "nacht" | "tief";

/**
 * Liest, welche Tageszeit gerade unter der Kopfleiste liegt.
 * Die Leiste wechselt dadurch die Farbe mit der Seite mit.
 *
 * Wichtig: die Sektionen werden bei jedem Update frisch abgefragt und der
 * Effekt läuft pro Route neu. Eine einmal gemerkte Liste zeigte nach einem
 * Seitenwechsel auf die entfernten Sektionen der alten Seite – die Leiste
 * blieb dann auf der falschen Tageszeit stehen (dunkles Menü auf dunkler
 * Seite).
 */
export function useSectionTheme() {
  const path = usePathname();
  const [hour, setHour] = useState<Hour>("tag");
  const [label, setLabel] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 40);
      const sections = document.querySelectorAll<HTMLElement>("section[data-hour]");
      if (!sections.length) return;
      const probe = 72; // knapp unter der Leiste
      // Liegt zwischen zwei Sektionen ein Streifen ohne data-hour, gilt die
      // zuletzt passierte – nicht die erste der Seite. Sonst sprangen
      // Leiste und Stundenschiene auf verschiedene Stunden.
      let current: HTMLElement = sections[0];
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= probe) current = s;
      }
      setHour((current.dataset.hour as Hour) ?? "tag");
      setLabel(current.dataset.stamp ?? null);
    };

    update();
    // Nach der Hydration einmal nachziehen – beim Routenwechsel steht das
    // neue DOM erst einen Tick später.
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [path]);

  return { hour, label, scrolled };
}
