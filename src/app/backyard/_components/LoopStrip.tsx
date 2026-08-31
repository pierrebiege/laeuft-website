"use client";

import { useRaceClock } from "@/app/backyard/_lib/clock";
import { COURSE } from "@/app/backyard/_data/event";

const LOOP_M = 6706;
const HALF = LOOP_M / 2; // 3353 m bis zum Wendepunkt

/**
 * Die Runde als Schema: hin oben, zurück unten, Wendepunkt rechts.
 * Kilometermarken, beide Strassenquerungen, Start und Ziel.
 * Der Punkt dreht pro Stunde genau eine Runde – an der echten Uhr.
 * Das ist das Format, keine Positionsangabe.
 */
export default function LoopStrip({ startISO }: { startISO: string }) {
  const c = useRaceClock(startISO, 100);

  const W = 1000;
  const H = 150;
  const L = 40;
  const R = 915;
  const yOut = 48;
  const yBack = 102;
  const r = (yBack - yOut) / 2;
  const span = R - L;

  const x = (m: number) => L + (Math.min(m, HALF) / HALF) * span;

  // Runde im Stundentakt: 0 → 1 über 60 Minuten
  const p = c.ready ? c.intoHour / 3_600_000 : 0;
  const dist = p * LOOP_M;
  const arcLen = Math.PI * r;
  const total = 2 * span + arcLen;
  const along = p * total;

  let dot: { x: number; y: number };
  if (along <= span) dot = { x: L + along, y: yOut };
  else if (along <= span + arcLen) {
    const a = (along - span) / arcLen; // 0..1 über den Halbkreis
    const ang = -Math.PI / 2 + a * Math.PI;
    dot = { x: R + Math.cos(ang) * r, y: yOut + r + Math.sin(ang) * r };
  } else dot = { x: R - (along - span - arcLen), y: yBack };

  const kms = [1, 2, 3];
  const crossings = COURSE.crossings.map((c, i) => ({ m: c.m, n: i + 1, short: c.short }));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Schematic of the 6706 metre out-and-back loop">
        {/* Bahn */}
        <path
          d={`M ${L} ${yOut} H ${R} A ${r} ${r} 0 0 1 ${R} ${yBack} H ${L}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          opacity={0.9}
        />
        {/* Start/Ziel-Strich */}
        <line x1={L} y1={yOut - 14} x2={L} y2={yBack + 14} stroke="currentColor" strokeWidth={2} />

        {/* km-Marken hin und zurück */}
        {kms.map((k) => (
          <g key={k}>
            <line x1={x(k * 1000)} y1={yOut - 5} x2={x(k * 1000)} y2={yOut + 5} stroke="currentColor" strokeWidth={1} />
            <text x={x(k * 1000)} y={yOut - 12} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="currentColor" opacity={0.6}>
              {k} km
            </text>
            <line x1={x(k * 1000)} y1={yBack - 5} x2={x(k * 1000)} y2={yBack + 5} stroke="currentColor" strokeWidth={1} />
            <text x={x(k * 1000)} y={yBack + 22} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="currentColor" opacity={0.6}>
              {((LOOP_M - k * 1000) / 1000).toFixed(1)} km
            </text>
          </g>
        ))}

        {/* Querungen */}
        {crossings.map((cr) => (
          <g key={cr.m}>
            <line x1={x(cr.m)} y1={yOut - 9} x2={x(cr.m)} y2={yOut + 9} stroke="var(--byd-accent)" strokeWidth={2} />
            <line x1={x(cr.m)} y1={yBack - 9} x2={x(cr.m)} y2={yBack + 9} stroke="var(--byd-accent)" strokeWidth={2} />
            <text x={x(cr.m)} y={yOut + r + 4} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--byd-accent)">
              {cr.n}
            </text>
          </g>
        ))}

        {/* Wendepunkt */}
        <text x={R + r + 10} y={yOut + r + 4} fontSize={10} fontFamily="var(--font-mono)" fill="currentColor" opacity={0.6}>
          3353 m
        </text>

        {/* Start/Ziel-Label */}
        <text x={L} y={yBack + 34} textAnchor="start" fontSize={10} fontFamily="var(--font-mono)" fill="currentColor" opacity={0.6}>
          Start · Finish
        </text>

        {/* Der Punkt */}
        <circle cx={dot.x} cy={dot.y} r={5} fill="var(--byd-accent)" />
      </svg>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <span className="stamp">
          {crossings.map((cr, i) => (
            <span key={cr.m}>
              {i > 0 ? " · " : ""}
              <span style={{ color: "var(--byd-accent)" }}>{cr.n}</span> {cr.short}
            </span>
          ))}
        </span>
        <span className="stamp tnum">
          {c.ready ? `${Math.round(dist).toLocaleString("en-GB")} m into the hour` : ""}
        </span>
      </div>
    </div>
  );
}
