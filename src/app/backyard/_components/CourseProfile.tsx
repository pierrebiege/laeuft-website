import { COURSE_ELE, COURSE_PROFILE, COURSE_TOTAL_M, COURSE_TURN } from "@/app/backyard/_data/course-path";

const W = 1000;

/**
 * Das Höhenprofil der Runde, so wie Doron sie aufgezeichnet hat.
 * Der Punkt ist nicht die Zahl, sondern die Form: hinaus geht es bergab,
 * zurück bergauf – jede Runde, sechzig Mal, vielleicht öfter.
 *
 * Mit `at` (Meter ab Start) läuft ein Reiter mit und die schon gelaufene
 * Höhe wird kräftiger gezeichnet. So gehören Grundriss und Profil
 * zusammen, statt zwei Bilder derselben Sache zu sein.
 */
export default function CourseProfile({
  at,
  height = 190,
  axis = true,
}: {
  at?: number;
  height?: number;
  axis?: boolean;
}) {
  const H = height;
  const PAD_T = 18;
  const PAD_B = axis ? 34 : 10;

  const n = COURSE_PROFILE.length - 1;
  const lo = Math.min(...COURSE_PROFILE);
  const hi = Math.max(...COURSE_PROFILE);
  const span = hi - lo || 1;

  const x = (i: number) => (i / n) * W;
  const y = (m: number) => PAD_T + (1 - (m - lo) / span) * (H - PAD_T - PAD_B);
  const xOfM = (m: number) => (m / COURSE_TOTAL_M) * W;

  const pt = (i: number) => `${x(i).toFixed(1)} ${y(COURSE_PROFILE[i]).toFixed(1)}`;
  const line = COURSE_PROFILE.map((_, i) => `${i === 0 ? "M" : "L"} ${pt(i)}`).join(" ");

  // Der Wendepunkt teilt hin und zurück.
  const turnI = Math.round((COURSE_TURN[2] / COURSE_TOTAL_M) * n);
  const back = COURSE_PROFILE.slice(turnI)
    .map((_, k) => `${k === 0 ? "M" : "L"} ${pt(turnI + k)}`)
    .join(" ");
  const fill = `${line} L ${W} ${H - PAD_B} L 0 ${H - PAD_B} Z`;

  // Laufender Reiter
  const live = at !== undefined;
  const frac = live ? Math.min(1, Math.max(0, at / COURSE_TOTAL_M)) : 0;
  const fi = frac * n;
  const ele =
    COURSE_PROFILE[Math.floor(fi)] +
    (COURSE_PROFILE[Math.min(n, Math.ceil(fi))] - COURSE_PROFILE[Math.floor(fi)]) * (fi % 1);

  const kms = Array.from({ length: Math.floor(COURSE_TOTAL_M / 1000) }, (_, k) => k + 1);

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

        {axis &&
          kms.map((k) => (
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

        {/* Hinweg neutral, Rückweg rot – wie im Grundriss */}
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          opacity={live ? 0.3 : 0.85}
        />
        <path
          d={back}
          fill="none"
          stroke="var(--byd-accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          opacity={live ? 0.25 : 1}
        />

        {/* Schon gelaufen */}
        {live && (
          <>
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={`${Math.min(frac, turnI / n)} 1`}
            />
            {frac > turnI / n && (
              <path
                d={back}
                fill="none"
                stroke="var(--byd-accent)"
                strokeWidth={3}
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={`${(frac - turnI / n) / (1 - turnI / n)} 1`}
              />
            )}
          </>
        )}

        {/* Wendepunkt */}
        <line
          x1={x(turnI)}
          y1={y(COURSE_PROFILE[turnI])}
          x2={x(turnI)}
          y2={H - PAD_B}
          stroke="var(--byd-accent)"
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={0.6}
        />

        {live ? (
          <g>
            <line
              x1={x(fi)}
              y1={y(ele)}
              x2={x(fi)}
              y2={H - PAD_B}
              stroke="var(--byd-accent)"
              strokeWidth={1}
              opacity={0.5}
            />
            <circle cx={x(fi)} cy={y(ele)} r={6} fill="var(--byd-accent)" />
          </g>
        ) : (
          <circle cx={x(turnI)} cy={y(COURSE_PROFILE[turnI])} r={4.5} fill="var(--byd-accent)" />
        )}

        {axis && (
          <>
            <text x={0} y={y(hi) - 7} fontSize={12} fontFamily="var(--font-mono)" fill="currentColor" opacity={0.55}>
              {Math.round(hi)} m
            </text>
            <text x={0} y={y(lo) - 3} fontSize={12} fontFamily="var(--font-mono)" fill="currentColor" opacity={0.55}>
              {Math.round(lo)} m
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
