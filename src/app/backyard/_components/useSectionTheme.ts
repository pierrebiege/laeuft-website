"use client";

import { useEffect, useState } from "react";

export type Hour = "tag" | "daemmerung" | "nacht" | "tief";

/**
 * Liest, welche Tageszeit gerade unter der Kopfleiste liegt.
 * Die Leiste wechselt dadurch die Farbe mit der Seite mit – so wie
 * das Rennen die Farbe wechselt, während man drin ist.
 */
export function useSectionTheme() {
  const [hour, setHour] = useState<Hour>("tag");
  const [label, setLabel] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[data-hour]"));

    const update = () => {
      setScrolled(window.scrollY > 40);
      const probe = 72; // knapp unter der Leiste
      let current = sections[0];
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) current = s;
      }
      if (!current) return;
      setHour((current.dataset.hour as Hour) ?? "tag");
      setLabel(current.dataset.stamp ?? null);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { hour, label, scrolled };
}
