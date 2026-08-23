import Link from "next/link";
import Dial from "@/app/backyard/_components/Dial";
import Reveal from "@/app/backyard/_components/Reveal";
import Rail from "@/app/backyard/_components/Rail";
import PinnedTally from "@/app/backyard/_components/PinnedTally";
import Section, { Dawn, TONE } from "@/app/backyard/_components/Section";
import LoopStrip from "@/app/backyard/_components/LoopStrip";
import OnPaper from "@/app/backyard/_components/OnPaper";
import RunnerCard from "@/app/backyard/_components/RunnerCard";
import { EVENT, TEAM, RESERVE, HISTORY, RULES, COURSE, STAFF, RACE_DAY } from "@/app/backyard/_data/event";

export default function Home() {
  return (
    <>
      <Hero />
      <Format />
      <Dawn from={TONE.tag} to={TONE.daemmerung} />
      <Scoring />
      <Dawn from={TONE.daemmerung} to={TONE.nacht} />
      <Squad />
      <Paper />
      <Rules />
      <PastResults />
      <Dawn from={TONE.tief} to={TONE.tag} />
      <RaceDay />
    </>
  );
}

/* ═══════════════════════════════════ Hour 00 · Saturday 14:00 */

function Hero() {
  return (
    <section
      data-hour="tag"
      data-stamp="Hour 00 · Sat 14:00"
      className="flex min-h-dvh flex-col justify-between px-5 pb-8 pt-20"
    >
      <div className="mx-auto grid w-full max-w-[76rem] flex-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b pb-4 rule">
            <span className="stamp">Backyard Ultra</span>
            <span className="stamp">World Team Championship</span>
            <span className="stamp ml-auto">Baar ZG</span>
          </div>

          <h1 className="display text-[2.05rem] leading-[0.92] sm:text-[3.6rem] lg:text-[4.8rem]">
            One loop.
            <br />
            Every hour.
            <br />
            <span style={{ color: "var(--byd-accent)" }}>Until nobody can.</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-relaxed sm:mt-8 sm:text-[15px]" style={{ color: "var(--byd-mute)" }}>
            Fifteen runners for Switzerland, 6706 metres, on the hour. Not in the
            corral at the bell and you are out. Loop not finished inside sixty
            minutes and you are out. The country with the most completed loops wins.
          </p>

          <div className="mt-7 grid max-w-md grid-cols-2 gap-px sm:mt-9 sm:inline-grid">
            <Link
              href="/backyard/live"
              className="border px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] sm:px-6 sm:text-[13px]"
              style={{ background: "var(--byd-accent)", color: "#fff", borderColor: "var(--byd-accent)" }}
            >
              Live scoring
            </Link>
            <Link
              href="/backyard/squad"
              className="border px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] sm:px-6 sm:text-[13px] rule"
            >
              The squad
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Dial startISO={EVENT.startISO} size={340} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[76rem] items-baseline justify-between border-t pt-4 rule">
        <span className="stamp">Sat 17 October 2026</span>
        <span className="stamp hidden sm:block">Vereinshaus SV Baar</span>
        <span className="stamp">Scroll ↓</span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════ Hour 01 · Saturday 15:00 */

function Format() {
  const facts = [
    {
      n: "6706",
      u: "Metres",
      t: "The loop. Out and back along the Lorze, gravel and concrete, about 30 metres of climb. The same one every time.",
    },
    {
      n: "60",
      u: "Minutes",
      t: "That is all there is. Run the loop in fifty and you get ten minutes to eat, change and sit down.",
    },
    {
      n: "15",
      u: "Runners",
      t: "No categories, no age groups, no separate fields. Everyone starts the same loop at the same second.",
    },
  ];

  return (
    <Section hour="tag" stamp="Hour 01 · Sat 15:00" title="The format">
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">No finish line. A bell every hour.</h2>
        <div className="mt-14 grid border-t rule sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.n} className="border-b py-8 sm:border-r sm:px-7 sm:first:pl-0 sm:last:border-r-0 rule">
              <p className="display tnum text-[3.4rem] leading-none sm:text-[4.2rem]">{f.n}</p>
              <p className="stamp mt-3">{f.u}</p>
              <p className="mt-5 max-w-xs text-sm leading-relaxed" style={{ color: "var(--byd-mute)" }}>
                {f.t}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-16">
          <div className="mb-5 flex items-baseline justify-between gap-6">
            <span className="stamp">The loop, to scale</span>
            <span className="stamp">The dot runs one loop per hour, on the clock</span>
          </div>
          <LoopStrip startISO={EVENT.startISO} />
        </div>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 05 · Saturday 19:00 */

function Scoring() {
  return (
    <section data-hour="daemmerung" data-stamp="Hour 05 · Sat 19:00">
      <PinnedTally />
    </section>
  );
}

/* ═══════════════════════════════════ Hour 08 · Saturday 22:00 */

function Squad() {
  const all = [...TEAM, ...RESERVE];
  return (
    <Section hour="nacht" stamp="Hour 08 · Sat 22:00" title="The squad" wide>
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">Fifteen runners.</h2>
        <p className="mt-6 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          The number is each runner&rsquo;s best loop count between 16 August 2024 and
          15 August 2026. Two places came from Silver Ticket wins, thirteen from the
          At Large list.
        </p>
      </Reveal>

      <div className="mt-14">
        <Rail label="15 runners · drag or use the arrows">
          {all.map((a) => (
            <RunnerCard key={`${a.first}-${a.name}`} a={a} />
          ))}
        </Rail>
      </div>

      <Reveal>
        <div className="mt-14 border-t pt-6 rule">
          <p className="stamp mb-6">Race organisation</p>
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {STAFF.map((s) => (
              <div key={s.name}>
                <p className="stamp mb-2">{s.role}</p>
                <p className="text-[15px] font-medium uppercase tracking-tight">{s.name}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--byd-mute)" }}>
                  {s.does.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
        <Link href="/backyard/squad" className="stamp mt-8 inline-block underline underline-offset-4">
          Full squad with personal bests →
        </Link>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 11 · Sunday 01:00 */

function Paper() {
  return (
    <Section hour="nacht" stamp="Hour 11 · Sun 01:00" title="What the numbers say">
      <OnPaper />
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 14 · Sunday 04:00 */

function Rules() {
  return (
    <Section hour="tief" stamp="Hour 14 · Sun 04:00" title="Rules">
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">
          Two ways out: the bell, or the hour.
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-2">
        <Reveal>
          <p className="stamp mb-6">Backyard</p>
          <ol className="border-t rule">
            {RULES.backyard.map((t, i) => (
              <li key={t} className="flex gap-6 border-b py-4 rule">
                <span className="font-mono text-[11px] tnum pt-1" style={{ color: "var(--byd-mute)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] leading-relaxed">{t}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal>
          <p className="stamp mb-6">Teamwork</p>
          <ol className="border-t rule">
            {RULES.teamwork.map((t, i) => (
              <li key={t} className="flex gap-6 border-b py-4 rule">
                <span className="font-mono text-[11px] tnum pt-1" style={{ color: "var(--byd-mute)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] leading-relaxed">{t}</p>
              </li>
            ))}
          </ol>
          <Link href="/backyard/rules" className="stamp mt-8 inline-block underline underline-offset-4">
            All rules →
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 18 · Sunday 08:00 */

function PastResults() {
  const max = Math.max(...HISTORY.flatMap((h) => [h.ch, h.at, h.de]));
  return (
    <Section hour="tief" stamp="Hour 18 · Sun 08:00" title="Past championships">
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">2020: 373. 2022: 360. 2024: 501.</h2>
        <p className="mt-6 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Germany finished ahead of Switzerland every time, Austria behind every time.
        </p>
      </Reveal>

      <div className="mt-14 border-t rule">
        {HISTORY.map((h) => (
          <Reveal key={h.year}>
            <div className="grid items-center gap-6 border-b py-7 sm:grid-cols-[5rem_1fr] rule">
              <p className="display tnum text-2xl">{h.year}</p>
              <div>
                {[
                  { l: "Switzerland", v: h.ch, hot: true },
                  { l: "Germany", v: h.de, hot: false },
                  { l: "Austria", v: h.at, hot: false },
                ].map((row) => (
                  <div key={row.l} className="flex items-center gap-4 py-1">
                    <span className="stamp w-24 shrink-0">{row.l}</span>
                    <span className="h-3 flex-1">
                      <span
                        className="block h-full"
                        style={{
                          width: `${(row.v / max) * 100}%`,
                          background: row.hot ? "var(--byd-accent)" : "var(--byd-rule)",
                        }}
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right font-mono text-xs tnum">{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
        <Reveal>
          <div className="grid items-center gap-6 border-b py-7 sm:grid-cols-[5rem_1fr] rule">
            <p className="display tnum text-2xl" style={{ color: "var(--byd-accent)" }}>
              2026
            </p>
            <div className="flex items-center gap-4 py-1">
              <span className="stamp w-24 shrink-0">Switzerland</span>
              <span
                className="h-3 flex-1"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, var(--byd-rule) 0 2px, transparent 2px 8px)",
                }}
              />
              <span className="w-10 shrink-0 text-right font-mono text-xs">?</span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 26 · Sunday 16:00 */

function RaceDay() {
  return (
    <Section hour="tag" stamp="Hour 26 · Sun 16:00" title="Course and race day">
      <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[2rem] sm:text-5xl">Baar, along the Lorze.</h2>
          <dl className="mt-10 border-t rule">
            {[
              ["Start and finish", COURSE.start],
              ["Shape", COURSE.shape],
              ["Surface", COURSE.surface],
              ["Climb", COURSE.elevation],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 border-b py-4 rule">
                <dt className="stamp shrink-0">{k}</dt>
                <dd className="text-right text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
          <Link href="/backyard/course" className="stamp mt-8 inline-block underline underline-offset-4">
            Course detail →
          </Link>
        </Reveal>

        <Reveal>
          <p className="stamp mb-6">On race day</p>
          <p className="max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            Loop counts come straight from the timing system in Baar and refresh every
            thirty seconds. The world standings pull in every nation that publishes its
            timing feed. Both already run on the real 2024 data.
          </p>
          <div className="mt-8 border-t rule">
            <RaceLink href="/backyard/live" label="Live scoring" note="Team Switzerland, loop by loop" />
            <RaceLink href="/backyard/world" label="World standings" note="All nations with a public feed" />
            {RACE_DAY.timing && (
              <RaceLink href={RACE_DAY.timing} label="Official timing" note="race|result, Baar 2026" external />
            )}
            {RACE_DAY.youtube && (
              <RaceLink href={RACE_DAY.youtube} label="Livestream" note="YouTube" external />
            )}
            <RaceLink href={RACE_DAY.bigs} label="Big&rsquo;s roster" note="All national teams" external />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function RaceLink({
  href,
  label,
  note,
  external,
}: {
  href: string;
  label: string;
  note: string;
  external?: boolean;
}) {
  const inner = (
    <span className="flex items-baseline justify-between gap-6 border-b py-4 rule">
      <span className="text-[15px] font-medium uppercase tracking-tight">
        {label} {external && "↗"}
      </span>
      <span className="stamp text-right">{note}</span>
    </span>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      {inner}
    </a>
  ) : (
    <Link href={href} className="block">
      {inner}
    </Link>
  );
}
