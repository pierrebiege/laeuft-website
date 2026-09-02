import Count from "./Count";
import Reveal from "./Reveal";
import { TEAM, BENCH_2024, HISTORY, pastResults } from "@/app/backyard/_data/event";

/**
 * «On paper»: was die Qualifikationszahlen über dieses Jahr sagen,
 * gemessen am Resultat 2024 an derselben Position.
 * Nur Zahlen, die im Briefing stehen, und was sich daraus ausrechnen lässt.
 */
export default function OnPaper() {
  const quals = [...TEAM].map((a) => a.qual).sort((a, b) => b - a);
  const sumQual = quals.reduce((s, q) => s + q, 0);
  const last = HISTORY[HISTORY.length - 1].ch;
  const returning = TEAM.filter((a) => pastResults(a).length > 0).length;
  const max = Math.max(...quals, ...BENCH_2024);

  return (
    <div>
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">On paper.</h2>
        <p className="mt-6 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Add up the fifteen qualifying results and you get {sumQual} loops. The 2024 team
          scored {last}. At every one of the fifteen positions, this year&rsquo;s qualifying
          number is equal to or higher than the 2024 result at the same position.
          A qualifying result is not a race day. It is still the only evidence there is.
        </p>
      </Reveal>

      <Reveal>
        <div className="mt-12 grid border-y sm:grid-cols-3 rule">
          <Stat label="Qualifying total" value={sumQual} accent />
          <Stat label="Scored in 2024" value={last} />
          <Stat label="Been here before" text={`${returning} of ${TEAM.length}`} />
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
            <span className="stamp">Position by position</span>
            <span className="stamp flex items-center gap-5">
              <span className="flex items-center gap-2">
                <span className="h-2 w-5" style={{ background: "var(--byd-accent)" }} /> 2026 qualifying
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-5" style={{ background: "var(--bar)" }} /> 2024 result
              </span>
            </span>
          </div>
          <div className="border-t rule">
            {quals.map((q, i) => {
              const b = BENCH_2024[i] ?? 0;
              return (
                <div key={i} className="grid grid-cols-[2.5rem_1fr_5.5rem] items-center gap-4 border-b py-2 rule">
                  <span className="font-mono text-xs tnum" style={{ color: "var(--byd-mute)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative h-5">
                    <span
                      className="absolute inset-y-0 left-0"
                      style={{ width: `${(b / max) * 100}%`, background: "var(--bar)" }}
                    />
                    <span
                      className="absolute left-0 top-1/2 h-2 -translate-y-1/2"
                      style={{ width: `${(q / max) * 100}%`, background: "var(--byd-accent)" }}
                    />
                  </div>
                  <span className="text-right font-mono text-xs tnum">
                    {q} <span style={{ color: "var(--byd-mute)" }}>/ {b}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Stat({ label, value, text, accent }: { label: string; value?: number; text?: string; accent?: boolean }) {
  return (
    <div className="border-b py-8 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 rule">
      <p className="stamp mb-3">{label}</p>
      <p className="display text-[2.6rem] leading-none" style={accent ? { color: "var(--byd-accent)" } : undefined}>
        {value !== undefined ? <Count to={value} /> : text}
      </p>
    </div>
  );
}
