"use client";

import { COURSE_ELE, COURSE_PROFILE, COURSE_TOTAL_M, COURSE_TURN } from "@/app/backyard/_data/course-path";

const W = 1000;
const H = 190;
const PAD_T = 18;
const PAD_B = 34;

/**
 * Das Höhenprofil der Runde, so wie Doron sie aufgezeichnet hat.
 * Der Punkt hier ist nicht die Zahl, sondern die Form: hinaus geht es
 * bergab, zurück bergauf – jede Runde, sechzig Mal, vielleicht öfter.
 * Der Hinweg ist neutral gezeichnet, der Rückweg rot.
 */
export default function CourseProfile() {
  const n = COURSE_PROFILE.length - 1;
  const lo = Math.min(...COURSE_PROFILE);
  const hi = Math.max(...COURSE_PROFILE);
  const span = hi - lo || 1;

  const x = (i: number) => (i / n) * W;
  const y = (m: number) => PAD_T + (1 - (m - lo) / span) * (H - PAD_T - PAD_B);

  const pt = (i: number) => `${x(i).toFixed(1)} ${y(COURSE_PROFILE[i]).toFixed(1)}`;
  const line = COURSE_PROFILE.map((_, i) => `${i === 0 ? "M" : "L"} ${pt(i)}`).join(" ");

  // Der Wendepunkt teilt hin und zurück.
  const turnI = Math.round((COURSE_TURN[2] / COURSE_TOTAL_M) * n);
  const back = COURSE_PROFILE.slice(turnI)
    .map((_, k) => `${k === 0 ? "M" : "L"} ${pt(turnI + k)}`)
    .join(" ");
  const fill = `${line} L ${W} ${H - PAD_B} L 0 ${H - PAD_B} Z`;

  // Kilometermarken auf der Grundlinie, in echten Streckenmetern.
  const kms = Array.from({ length: Math.floor(COURSE_TOTAL_M / 1000) }, (_, k) => k + 1);
  const xOfM = (m: number) => (m / COURSE_TOTAL_M) * W;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={`Elevation of the loop: ${COURSE_ELE.drop} metres down to the turnaround and the same back up`}
      >
        <path d={fill} fill="var(--byd-fg)" opacity={0.05} />
        <line x1={0} y1={H - PAD_B} x2={W} y2={H - PAD_B} stroke="var(--byd-rule)" strokeWidth={1} />

        {kms.map((k) => (
          <g key={k}>
            <line
              x1={xOfM(k * 1000)}
              y1={H - PAD_B}
              x2={xOfM(k * 1000)}
              y2={H - PAD_B + 5}
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.5}
            />
            <text
              x={xOfM(k * 1000)}
              y={H - PAD_B + 20}
              textAnchor="middle"
              fontSize={12}
              fontFamily="var(--font-mono)"
              fill="currentColor"
              opacity={0.55}
            >
              {k}
            </text>
          </g>
        ))}

        <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
        <path d={back} fill="none" stroke="var(--byd-accent)" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Wendepunkt */}
        <line
          x1={x(turnI)}
          y1={y(COURSE_PROFILE[turnI])}
          x2={x(turnI)}
          y2={H - PAD_B}
          stroke="var(--byd-accent)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />
        <circle cx={x(turnI)} cy={y(COURSE_PROFILE[turnI])} r={4.5} fill="var(--byd-accent)" />

        <text
          x={0}
          y={y(hi) - 7}
          fontSize={12}
          fontFamily="var(--font-mono)"
          fill="currentColor"
          opacity={0.55}
        >
          {Math.round(hi)} m
        </text>
        <text
          x={0}
          y={y(lo) + 4}
          fontSize={12}
          fontFamily="var(--font-mono)"
          fill="currentColor"
          opacity={0.55}
        >
          {Math.round(lo)} m
        </text>
      </svg>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <span className="stamp">Kilometres from the start · turnaround in red</span>
        <span className="stamp tnum">
          −{COURSE_ELE.drop} m out, +{COURSE_ELE.drop} m back, every loop
        </span>
      </div>

      <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed">
        The loop is not flat. It runs downhill to the turnaround and back up the whole way
        home, so every single loop ends on the climb — with the bell already in earshot.
        Nineteen metres is nothing in the first yard and something else entirely in the
        thirtieth.
      </p>
    </div>
  );
}
