"use client";

import { useEffect, useRef, useState } from "react";

const HOURS = 48;
const RUNNERS = 15;

const STEPS = [
  {
    at: 0,
    head: "Eine Runde ist ein Punkt.",
    body: "Nicht die schnellste Zeit zählt und nicht der beste Läufer. Jede Runde, die irgendjemand aus dem Team zu Ende bringt, ist ein Punkt für die Schweiz.",
  },
  {
    at: 0.34,
    head: "Volles Team ist alles.",
    body: "Fünfzehn Läufer, vierundzwanzig Stunden, dreihundertsechzig Punkte. Ein einziger Ausfall kostet jede weitere Stunde einen Punkt. Deshalb lässt man niemanden zurück.",
  },
  {
    at: 0.68,
    head: "Belgien hat 1147 gemacht.",
    body: "2024 kam das ganze belgische Team durch achtundvierzig Stunden. Weltrekord. Die Schweiz stand bei 501. Das ist der Massstab, nicht die eigene Bestzeit.",
  },
];

export default function PinnedTally() {
  const wrap = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      setP(total <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / total)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const filled = Math.round(p * HOURS);
  const points = filled * RUNNERS;
  const step = [...STEPS].reverse().find((s) => p >= s.at) ?? STEPS[0];

  return (
    <div ref={wrap} className="relative" style={{ height: "260vh" }}>
      <div className="sticky top-0 flex h-dvh items-center px-5">
        <div className="mx-auto grid w-full max-w-[76rem] items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="stamp">Die Rechnung</span>
            <h2 className="display mt-5 text-[2rem] sm:text-5xl">{step.head}</h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
              {step.body}
            </p>

            <div className="mt-10 flex items-end gap-10 border-t pt-6 rule">
              <div>
                <p className="stamp mb-2">Stunde</p>
                <p className="display tnum text-4xl">{String(filled).padStart(2, "0")}</p>
              </div>
              <div>
                <p className="stamp mb-2">Punkte</p>
                <p className="display tnum text-4xl" style={{ color: "var(--byd-accent)" }}>
                  {points}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="stamp mb-2">Belgien 2024</p>
                <p className="display tnum text-4xl" style={{ color: "var(--byd-mute)" }}>
                  1147
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="stamp">15 Läufer</span>
              <span className="stamp">Stunde 1 → 48</span>
            </div>
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${HOURS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${RUNNERS}, 17px)`,
              }}
              aria-hidden
            >
              {Array.from({ length: RUNNERS * HOURS }).map((_, i) => {
                const col = i % HOURS;
                const on = col < filled;
                return (
                  <span
                    key={i}
                    style={{
                      background: on ? "var(--byd-accent)" : "var(--byd-rule)",
                      opacity: on && col === filled - 1 ? 1 : undefined,
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-6 border-t pt-3 rule">
              <span className="stamp">Volles Team</span>
              <span className="stamp">1 Feld = 1 Punkt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
