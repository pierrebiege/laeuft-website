"use client";

import { COURSE_PATH, COURSE_KMS, COURSE_TOTAL_M, COURSE_TURN, COURSE_VIEW } from "@/app/backyard/_data/course-path";
import { COURSE } from "@/app/backyard/_data/event";

const PAD = 44;
const { w: W, h: H } = COURSE_VIEW;

/**
 * Der Grundriss der Runde, aus Dorons GPX: Hinweg neutral, ab dem
 * Wendepunkt rot, Kilometer und Strassenquerungen blenden auf, wenn der
 * Punkt vorbei ist.
 *
 * Zeichnet nur – der Fortschritt kommt von aussen. So dient dasselbe Bild
 * als Rückfall für das Gelände, wo kein WebGL läuft, und als ruhige
 * Übersicht auf der Startseite.
 *
 * Der Grundriss ist ein breites Band (rund 4:1). Hochkant steht er auf dem
 * Telefon; die Schriften werden einzeln zurückgedreht und bleiben aufrecht.
 */
export default function CoursePlan({
  rev,
  vert = false,
  still = false,
  className = "max-h-[42vh] w-full",
}: {
  rev: number;
  vert?: boolean;
  still?: boolean;
  className?: string;
}) {
  const dist = rev * COURSE_TOTAL_M;
  const turnM = COURSE_TURN[2];
  const outFrac = turnM / COURSE_TOTAL_M;

  /** Position eines Streckenmeters auf dem Grundriss. */
  const at = (m: number) => {
    for (let i = 1; i < COURSE_PATH.length; i++) {
      const [x1, y1, m1] = COURSE_PATH[i - 1];
      const [x2, y2, m2] = COURSE_PATH[i];
      if (m <= m2) {
        const t = m2 === m1 ? 0 : (m - m1) / (m2 - m1);
        return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
      }
    }
    const [x, y] = COURSE_PATH[COURSE_PATH.length - 1];
    return { x, y };
  };

  const dot = at(dist);
  const d = COURSE_PATH.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const [sx, sy] = COURSE_PATH[0];
  const [tx, ty] = COURSE_TURN;
  const fade = still ? undefined : { transition: "opacity .4s" };

  const frame = vert
    ? { box: `${-PAD} ${-PAD} ${H + 2 * PAD} ${W + 2 * PAD}`, g: `translate(${H} 0) rotate(90)` }
    : { box: `${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`, g: undefined };
  const upright = (x: number, y: number) => (vert ? `rotate(-90 ${x} ${y})` : undefined);

  return (
    <svg
      viewBox={frame.box}
      className={`mx-auto block ${className}`}
      role="img"
      aria-label="The championship loop in Baar as recorded on course: out along the Lorze to the turnaround and back the same way."
          >
      <g transform={frame.g}>
        <path d={d} fill="none" stroke="var(--byd-rule)" strokeWidth={3} strokeLinejoin="round" />

        {/* Hinweg neutral */}
        <path
          d={d}
          fill="none"
          stroke="var(--byd-fg)"
          strokeWidth={3}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={Math.max(0, 1 - Math.min(rev, outFrac))}
          style={{ opacity: rev > 0 ? 1 : 0 }}
        />
        {/* Rückweg rot */}
        {rev > outFrac && (
          <path
            d={d}
            fill="none"
            stroke="var(--byd-accent)"
            strokeWidth={3.5}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={`${Math.max(0, rev - outFrac)} 1`}
            strokeDashoffset={-outFrac}
          />
        )}

        {/* Die beiden Strassenquerungen */}
        {COURSE.crossings.map((c, i) => {
          const q = at(c.m);
          return (
            <g key={c.m} opacity={dist >= c.m ? 1 : 0.3} style={fade}>
              <rect
                x={q.x - 8}
                y={q.y - 8}
                width={16}
                height={16}
                fill="var(--byd-bg)"
                stroke="var(--byd-accent)"
                strokeWidth={2}
                transform={`rotate(45 ${q.x} ${q.y})`}
              />
              <text
                x={q.x}
                y={q.y + 4}
                textAnchor="middle"
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill="var(--byd-accent)"
                transform={upright(q.x, q.y)}
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Kilometer – Hinweg oben beschriftet, Rückweg unten */}
        {COURSE_KMS.map(([x, y, km]) => {
          const backLeg = km * 1000 > turnM;
          const ly = backLeg ? y + 24 : y - 13;
          return (
            <g key={km} opacity={dist >= km * 1000 ? 1 : 0.22} style={fade}>
              <circle cx={x} cy={y} r={5} fill="var(--byd-bg)" stroke="currentColor" strokeWidth={1.5} />
              <text
                x={x}
                y={ly}
                textAnchor="middle"
                fontSize={15}
                fontFamily="var(--font-mono)"
                fill="currentColor"
                opacity={0.75}
                transform={upright(x, ly)}
              >
                {km}
              </text>
            </g>
          );
        })}

        <g>
          <rect x={sx - 6} y={sy - 6} width={12} height={12} fill="var(--byd-accent)" />
          <text
            x={sx}
            y={vert ? sy + 22 : sy - 16}
            textAnchor={vert ? "end" : "start"}
            fontSize={15}
            fontFamily="var(--font-mono)"
            fill="currentColor"
            opacity={0.75}
            transform={upright(sx, sy + 22)}
          >
            Start · Finish
          </text>
        </g>

        <g opacity={dist >= turnM ? 1 : 0.35} style={fade}>
          <circle cx={tx} cy={ty} r={6} fill="none" stroke="var(--byd-accent)" strokeWidth={2.5} />
          <text
            x={tx}
            y={ty + (vert ? 56 : 46)}
            textAnchor="end"
            fontSize={15}
            fontFamily="var(--font-mono)"
            fill="currentColor"
            opacity={0.75}
            transform={upright(tx, ty + 56)}
          >
            Turnaround
          </text>
        </g>

        {/* Der Grundriss ist auf seine Hauptachse gedreht – hier liegt Norden. */}
        <g opacity={0.45} transform={`translate(${W - 18} ${H + 6})`}>
          <g transform={`rotate(${COURSE_VIEW.north + (vert ? 90 : 0)})`}>
            <line x1={0} y1={9} x2={0} y2={-9} stroke="currentColor" strokeWidth={1.2} />
            <path d="M 0 -13 L 3.6 -6 L -3.6 -6 Z" fill="currentColor" />
          </g>
          <text
            x={0}
            y={26}
            textAnchor="middle"
            fontSize={11}
            fontFamily="var(--font-mono)"
            fill="currentColor"
            transform={upright(0, 26)}
          >
            N
          </text>
        </g>

        <circle cx={dot.x} cy={dot.y} r={8} fill="var(--byd-accent)" />
      </g>
    </svg>
  );
}
