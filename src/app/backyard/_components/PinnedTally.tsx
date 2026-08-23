"use client";

import { useEffect, useRef, useState } from "react";

const HOURS = 48;
const RUNNERS = 15;

const STEPS = [
  {
    at: 0,
    head: "One loop, one point.",
    body: "Speed does not score. Every loop any of the fifteen finishes is one point for Switzerland.",
  },
  {
    at: 0.34,
    head: "A full team scores more.",
    body: "Fifteen runners through twenty-four hours is 360 points. One person out costs a point every hour after that. That is the reason nobody gets left behind.",
  },
  {
    at: 0.68,
    head: "Belgium scored 1147.",
    body: "In 2024 the whole Belgian team went through 48 hours. World record. Switzerland scored 501 that year.",
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
            <span className="stamp">Scoring</span>
            <h2 className="display mt-5 text-[2rem] sm:text-5xl">{step.head}</h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
              {step.body}
            </p>

            <div className="mt-10 flex items-end gap-10 border-t pt-6 rule">
              <div>
                <p className="stamp mb-2">Hour</p>
                <p className="display tnum text-4xl">{String(filled).padStart(2, "0")}</p>
              </div>
              <div>
                <p className="stamp mb-2">Points</p>
                <p className="display tnum text-4xl" style={{ color: "var(--byd-accent)" }}>
                  {points}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="stamp mb-2">Belgium 2024</p>
                <p className="display tnum text-4xl" style={{ color: "var(--byd-mute)" }}>
                  1147
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="stamp">15 runners</span>
              <span className="stamp">Hour 1 → 48</span>
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
              <span className="stamp">Full team</span>
              <span className="stamp">1 square = 1 point</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
