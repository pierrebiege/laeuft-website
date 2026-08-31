"use client";

import { useEffect, useRef, useState } from "react";
import { useRaceClock, countdownText, pad } from "@/app/backyard/_lib/clock";

/**
 * Die Uhr des Rennens, gezeichnet wie ein Zifferblatt auf Papier:
 * sechzig Striche, ein roter Bogen für die verstrichene Stunde.
 * Vor dem Start läuft sie rückwärts auf den Glockenschlag zu.
 */
function Split({ text }: { text: string }) {
  const m = /^(\d+) D (.+)$/.exec(text);
  if (!m) {
    return <p className="font-mono text-[2rem] font-medium tnum leading-none">{text}</p>;
  }
  return (
    <>
      <p className="display tnum text-[3.2rem] leading-none">
        {m[1]}
        <span className="ml-2 text-base font-medium" style={{ color: "var(--byd-mute)" }}>
          Days
        </span>
      </p>
      <p className="mt-3 font-mono text-lg tnum" style={{ color: "var(--byd-mute)" }}>
        {m[2]}
      </p>
    </>
  );
}

export default function Dial({ startISO, size = 380 }: { startISO: string; size?: number }) {
  const c = useRaceClock(startISO, 1000);
  const [ringing, setRinging] = useState(false);
  const lastLap = useRef(-1);

  useEffect(() => {
    if (!c.running || c.lap === lastLap.current) return;
    const first = lastLap.current === -1;
    lastLap.current = c.lap;
    if (first) return;
    setRinging(true);
    const id = setTimeout(() => setRinging(false), 1200);
    return () => clearTimeout(id);
  }, [c.running, c.lap]);

  // Der Fortschritt ist die Minute in der laufenden Runde. Vor dem Start
  // gibt es keine laufende Runde, also auch keinen Bogen.
  const progress = c.ready && c.running ? c.intoHour / 3_600_000 : 0;
  const r = size / 2 - 16;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative mx-auto aspect-square" style={{ width: `min(${size}px, 66vw)` }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full -rotate-90">
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * 2 * Math.PI;
          const major = i % 5 === 0;
          const inner = r - (major ? 14 : 7);
          const cx = size / 2;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * inner}
              y1={cx + Math.sin(a) * inner}
              x2={cx + Math.cos(a) * r}
              y2={cx + Math.sin(a) * r}
              stroke="currentColor"
              strokeWidth={major ? 1.6 : 0.8}
              opacity={i / 60 <= progress ? 0.9 : 0.28}
            />
          );
        })}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--byd-accent)"
          strokeWidth={2.5}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - progress)}
          style={{ transition: "stroke-dashoffset 240ms linear" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {!c.ready ? (
          <div className="h-16 w-32" />
        ) : c.running ? (
          <>
            <p className="stamp mb-3">Loop</p>
            <p className="display tnum text-[5rem] leading-none sm:text-[6.5rem]">{c.lap}</p>
            <p className="mt-4 font-mono text-sm tnum" style={{ color: "var(--byd-mute)" }}>
              Bell in {pad(c.toBell / 60000)}:{pad((c.toBell % 60000) / 1000)}
            </p>
            <span className={`mt-3 text-xl ${ringing ? "bell-ring" : ""}`} aria-hidden>
              🔔
            </span>
          </>
        ) : (
          <>
            <p className="stamp mb-4">Bell in</p>
            <Split text={countdownText(c)} />
            <p className="stamp mt-4">17 October 2026 · 14:00</p>
          </>
        )}
      </div>
    </div>
  );
}
