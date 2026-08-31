"use client";

import { useEffect, useRef, useState } from "react";
import { COURSE_PATH, COURSE_KMS, COURSE_TOTAL_M, COURSE_TURN, COURSE_VIEW } from "@/app/backyard/_data/course-path";
import { COURSE, LOOP_M } from "@/app/backyard/_data/event";

const PAD = 44;
const { w: W, h: H } = COURSE_VIEW;

/**
 * Die echte Runde, aufgezeichnet von Doron auf der WM-Strecke. Beim Scrollen
 * läuft ein Punkt sie ab und zieht die Linie hinter sich her; ab dem
 * Wendepunkt wechselt sie auf Rot. Der Zähler ist auf die offiziellen 6706 m
 * skaliert – gemessen wurden 6517 m, GPS misst grosszügig.
 *
 * Der Grundriss ist ein breites Band (rund 4:1). Auf dem Telefon steht es
 * deshalb hochkant, damit es die Höhe des Bildschirms nutzt; die Schriften
 * werden einzeln zurückgedreht und bleiben aufrecht.
 */
export default function CourseScroll() {
  const wrap = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [vert, setVert] = useState(false);

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

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setVert(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const dist = p * COURSE_TOTAL_M;
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
  const loopM = Math.round(p * LOOP_M);

  // Hochkant: Inhalt um 90° drehen, Schrift einzeln zurück.
  const frame = vert
    ? { box: `${-PAD} ${-PAD} ${H + 2 * PAD} ${W + 2 * PAD}`, g: `translate(${H} 0) rotate(90)`, cls: "max-h-[68vh] w-auto" }
    : { box: `${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`, g: undefined, cls: "max-h-[56vh] w-full" };
  const upright = (x: number, y: number) => (vert ? `rotate(-90 ${x} ${y})` : undefined);

  return (
    <div ref={wrap} className="relative" style={{ height: "280vh" }}>
      <div className="sticky top-0 flex h-dvh flex-col justify-center px-5 pt-20 md:pt-0">
        <div className="mx-auto w-full max-w-[76rem]">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <span className="stamp">The loop, as recorded on course</span>
            <span className="stamp">{p < outFrac ? "Out" : "Back"} · scroll to run it</span>
          </div>

          <svg
            viewBox={frame.box}
            className={`mx-auto block ${frame.cls}`}
            role="img"
            aria-label="The championship loop in Baar as recorded on course: out along the Lorze to the turnaround and back the same way."
          >
            <g transform={frame.g}>
              {/* Grundlinie */}
              <path d={d} fill="none" stroke="var(--byd-rule)" strokeWidth={3} strokeLinejoin="round" />

              {/* Hinweg, neutral */}
              <path
                d={d}
                fill="none"
                stroke="var(--byd-fg)"
                strokeWidth={3}
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={Math.max(0, 1 - Math.min(p, outFrac))}
                style={{ opacity: p > 0 ? 1 : 0 }}
              />
              {/* Rückweg, rot */}
              {p > outFrac && (
                <path
                  d={d}
                  fill="none"
                  stroke="var(--byd-accent)"
                  strokeWidth={3.5}
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={`${Math.max(0, p - outFrac)} 1`}
                  strokeDashoffset={-outFrac}
                />
              )}

              {/* Die beiden Strassenquerungen */}
              {COURSE.crossings.map((c, i) => {
                const q = at(c.m);
                return (
                  <g key={c.m} opacity={dist >= c.m ? 1 : 0.3} style={{ transition: "opacity .4s" }}>
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
                const back = km * 1000 > turnM;
                const ly = back ? y + 24 : y - 13;
                return (
                  <g key={km} opacity={dist >= km * 1000 ? 1 : 0.22} style={{ transition: "opacity .4s" }}>
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

              {/* Start und Ziel sind derselbe Punkt */}
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

              <g opacity={dist >= turnM ? 1 : 0.35} style={{ transition: "opacity .4s" }}>
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
            </g>
          </svg>

          <div className="mt-6 grid gap-2 border-t pt-4 rule sm:grid-cols-3 sm:items-baseline sm:gap-4">
            <span className="stamp order-2 sm:order-none">Kilometres ○ · crossings ◇</span>
            <span className="display tnum order-1 text-3xl sm:order-none sm:text-center sm:text-4xl">
              {loopM.toLocaleString("en-GB")}
              <span className="stamp ml-2">of {LOOP_M} m</span>
            </span>
            <span className="stamp order-3 sm:order-none sm:text-right">GPX: Doron De Wolf</span>
          </div>
        </div>
      </div>
    </div>
  );
}
