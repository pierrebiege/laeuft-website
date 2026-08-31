"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

/**
 * Horizontale Bahn mit Scroll-Snap und zwei Pfeilen.
 * Alle Karten sind gleich breit – das ist bei einem Backyard nicht
 * Dekoration, sondern die Regel: alle laufen dieselbe Runde.
 */
export default function Rail({
  children,
  label,
  grid,
}: {
  children: ReactNode;
  label: string;
  /** Ab Tablet ein Raster statt einer Bahn – dieselbe Liste, ein DOM. */
  grid?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  };

  // Auch bei Fensteränderung nachziehen – sonst bleiben die Pfeile
  // deaktiviert, obwohl es wieder etwas zu scrollen gibt.
  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div>
      <div className={`mb-4 flex items-center justify-between gap-4 ${grid ? "sm:hidden" : ""}`}>
        <span className="stamp">{label}</span>
        <div className="flex gap-px">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              onClick={() => nudge(d)}
              disabled={d === -1 ? atStart : atEnd}
              aria-label={d === -1 ? "previous" : "next"}
              className="grid h-11 w-11 place-items-center border text-sm transition-opacity disabled:opacity-25 rule"
            >
              {d === -1 ? "←" : "→"}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={ref}
        onScroll={sync}
        className={`rail -mx-5 px-5 ${grid ? `rail-grid ${grid}` : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
