"use client";

import { useEffect, useRef, useState } from "react";
import { HISTORY, TEAM, WORLD_2024 } from "@/app/backyard/_data/event";

const HOURS = 48;
const RUNNERS = TEAM.length;
const FULL = HOURS * RUNNERS;
const CH_2024 = HISTORY[HISTORY.length - 1].ch;

const STEPS = [
  {
    at: 0,
    head: "One loop, one point.",
    body: "Speed does not score. Every loop any of the fifteen finishes is one point for Switzerland.",
  },
  {
    at: 0.34,
    head: "A full team scores more.",
    body: "Fifteen runners through twenty-four hours is 360 points. One person out costs a point every hour after that.",
  },
  {
    at: 0.68,
    head: `Belgium scored ${WORLD_2024.gold.yards}.`,
    body: `In 2024 all fifteen Belgians were still running after 48 hours. Nobody had ever done that. This grid stops there, at ${FULL} points — Belgium kept going, and everything their last runners added after hour 48 is in that number. Switzerland scored ${CH_2024}.`,
  },
];

/**
 * Wie die Wertung funktioniert, als Beispiel zum Scrollen: das Raster
 * füllt sich Stunde um Stunde, fünfzehn Zeilen hoch.
 *
 * Ausdrücklich kein Live-Stand – die Zahl kommt aus der Scrollposition.
 * Deshalb steht das auch daneben; ohne den Hinweis liest ein Fan am
 * Renntag den Zähler als unseren Punktestand.
 */
export default function PinnedTally() {
  const wrap = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [filled, setFilled] = useState(0);
  const [p, setP] = useState(0);

  useEffect(() => {
    // Gerastert auf ganze Stunden: das Raster kennt nur 49 Zustände, vorher
    // rendert es 300-mal dasselbe DOM aus 720 Feldern.
    const measure = () => {
      raf.current = 0;
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const raw = total <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / total));
      setP(raw);
      setFilled(Math.round(raw * HOURS));
    };
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const points = filled * RUNNERS;
  const step = [...STEPS].reverse().find((s) => p >= s.at) ?? STEPS[0];

  return (
    <div ref={wrap} className="relative" style={{ height: "260vh" }}>
      {/* min-h statt h: auf kleinen Telefonen wurde der Block sonst oben
          und unten abgeschnitten, und das Abgeschnittene war nicht
          erreichbar, weil der Scroll die Animation bewegt, nicht den Text. */}
      <div className="sticky top-0 flex min-h-dvh items-center px-5 py-20">
        <div className="mx-auto grid w-full max-w-[76rem] items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="stamp">Scoring · worked example</span>
            <h2 className="display mt-5 text-[2rem] sm:text-5xl">{step.head}</h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
              {step.body}
            </p>

            <div className="mt-10 flex items-end gap-8 border-t pt-6 rule sm:gap-10">
              <div>
                <p className="stamp mb-2">Hour</p>
                <p className="display tnum text-3xl sm:text-4xl">{String(filled).padStart(2, "0")}</p>
              </div>
              <div>
                <p className="stamp mb-2">Points</p>
                <p className="display tnum text-3xl sm:text-4xl" style={{ color: "var(--byd-accent)" }}>
                  {points}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="stamp mb-2">Belgium 2024</p>
                <p className="display tnum text-3xl sm:text-4xl" style={{ color: "var(--byd-mute)" }}>
                  {WORLD_2024.gold.yards}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="stamp">{RUNNERS} runners</span>
              <span className="stamp">Hour 1 → {HOURS}</span>
            </div>
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${HOURS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${RUNNERS}, clamp(7px, 1.7vh, 17px))`,
              }}
              aria-hidden
            >
              {Array.from({ length: RUNNERS * HOURS }).map((_, i) => {
                const col = i % HOURS;
                const on = col < filled;
                return <span key={i} style={{ background: on ? "var(--byd-accent)" : "var(--bar)" }} />;
              })}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-6 border-t pt-3 rule">
              <span className="stamp">Full team, every hour</span>
              <span className="stamp">One mark = one point</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
