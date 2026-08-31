"use client";

import { useEffect, useRef, useState } from "react";
import CourseProfile from "@/app/backyard/_components/CourseProfile";
import { COURSE_PATH, COURSE_KMS, COURSE_TOTAL_M, COURSE_TURN, COURSE_VIEW } from "@/app/backyard/_data/course-path";
import { COURSE, LOOP_M } from "@/app/backyard/_data/event";

const PAD = 44;
const { w: W, h: H } = COURSE_VIEW;

/** Vor- und Nachlauf: die Runde startet erst, wenn das Bild steht, und hält am Ende. */
const LEAD_IN = 0.08;
const LEAD_OUT = 0.1;

/**
 * Die Kapitel der Runde, an Streckenmetern festgemacht. Ein Rundkurs, den
 * man sechzig Mal läuft, hat keine Landschaft zu erzählen – aber einen
 * Ablauf, und der ist jede Stunde derselbe.
 */
const ACTS: { m: number; title: string; text: string }[] = [
  {
    m: 0,
    title: "The bell",
    text: "Every hour, on the hour. Everyone still in the race starts together, whether they are fresh or finished.",
  },
  {
    m: COURSE.crossings[0].m,
    title: "First crossing",
    text: "A quiet street with no zebra crossing. You look, then you go — at four in the morning as much as at two in the afternoon.",
  },
  {
    m: COURSE.crossings[1].m,
    title: "Second crossing",
    text: "Just before 2 km, with an island in the middle. From here the gravel runs along the Lorze and the trees close over the path.",
  },
  {
    m: COURSE_TURN[2],
    title: "Turnaround",
    text: "3.3 km out and 19 metres lower than the clubhouse. Everything from this cone onwards is uphill.",
  },
  {
    m: 5600,
    title: "The way back",
    text: "The climb home, with the bell already in earshot. Whatever is left of the hour is the rest — and then it rings again.",
  },
];

/**
 * Die echte Runde, aufgezeichnet von Doron. Beim Scrollen läuft ein Punkt
 * sie ab, zieht die Linie hinter sich her und wechselt am Wendepunkt auf
 * Rot; darunter läuft derselbe Punkt durchs Höhenprofil, damit man sieht,
 * dass die Runde kippt. Der Zähler ist auf die offiziellen 6706 m skaliert
 * – gemessen wurden 6517 m, GPS misst grosszügig.
 *
 * Der Grundriss ist ein breites Band (rund 4:1). Auf dem Telefon steht es
 * hochkant, damit es die Höhe nutzt; die Schriften werden einzeln
 * zurückgedreht und bleiben aufrecht.
 */
export default function CourseScroll() {
  const wrap = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [rev, setRev] = useState(0);
  const [vert, setVert] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    // Ein Scroll-Ereignis pro Bild, und der Fortschritt gerastert – sonst
    // rendert das ganze SVG öfter neu, als der Bildschirm zeigen kann.
    const measure = () => {
      raf.current = 0;
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const raw = total <= 0 ? 0 : -r.top / total;
      const eased = (raw - LEAD_IN) / (1 - LEAD_IN - LEAD_OUT);
      setRev(Math.round(Math.min(1, Math.max(0, eased)) * 400) / 400);
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

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setVert(narrow.matches);
      setStill(calm.matches);
    };
    apply();
    narrow.addEventListener("change", apply);
    calm.addEventListener("change", apply);
    return () => {
      narrow.removeEventListener("change", apply);
      calm.removeEventListener("change", apply);
    };
  }, []);

  const dist = rev * COURSE_TOTAL_M;
  const turnM = COURSE_TURN[2];
  const outFrac = turnM / COURSE_TOTAL_M;
  const act = ACTS.reduce((best, a, i) => (dist >= a.m ? i : best), 0);

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
  const loopM = Math.round(rev * LOOP_M);
  const fade = still ? undefined : { transition: "opacity .4s" };

  const frame = vert
    ? { box: `${-PAD} ${-PAD} ${H + 2 * PAD} ${W + 2 * PAD}`, g: `translate(${H} 0) rotate(90)`, cls: "max-h-[54vh] w-auto" }
    : { box: `${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`, g: undefined, cls: "max-h-[42vh] w-full" };
  const upright = (x: number, y: number) => (vert ? `rotate(-90 ${x} ${y})` : undefined);

  return (
    <div ref={wrap} className="relative" style={{ height: "360vh" }}>
      <div className="sticky top-0 flex h-dvh flex-col justify-center gap-5 px-5 pt-20 md:pt-0">
        <div className="mx-auto w-full max-w-[76rem]">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <span className="stamp">The loop, as recorded on course</span>
            <span className="stamp">{rev < outFrac ? "Out" : "Back"} · scroll to run it</span>
          </div>

          <svg
            viewBox={frame.box}
            className={`mx-auto block ${frame.cls}`}
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

          {/* Dasselbe Rennen von der Seite: das Profil läuft mit. */}
          <div className="mt-3">
            <CourseProfile at={dist} height={vert ? 96 : 120} axis={false} />
          </div>

          <div className="mt-4 grid gap-3 border-t pt-4 rule md:grid-cols-[1fr_auto_1fr] md:items-baseline md:gap-8">
            <p className="order-2 max-w-[42ch] text-[15px] leading-relaxed md:order-none">
              <span className="stamp mr-2">{ACTS[act].title}</span>
              {ACTS[act].text}
            </p>
            <span className="display tnum order-1 text-3xl md:order-none md:text-center md:text-4xl">
              {loopM.toLocaleString("en-GB")}
              <span className="stamp ml-2">of {LOOP_M} m</span>
            </span>
            <span className="stamp order-3 md:order-none md:text-right">GPX: Doron De Wolf</span>
          </div>
        </div>
      </div>
    </div>
  );
}
