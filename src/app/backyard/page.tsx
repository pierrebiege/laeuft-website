import Link from "next/link";
import Dial from "@/app/backyard/_components/Dial";
import Reveal from "@/app/backyard/_components/Reveal";
import Rail from "@/app/backyard/_components/Rail";
import PinnedTally from "@/app/backyard/_components/PinnedTally";
import Section, { Dawn, TONE } from "@/app/backyard/_components/Section";
import CourseProfile from "@/app/backyard/_components/CourseProfile";
import LoopStrip from "@/app/backyard/_components/LoopStrip";
import OnPaper from "@/app/backyard/_components/OnPaper";
import Partners from "@/app/backyard/_components/Partners";
import RunnerCard from "@/app/backyard/_components/RunnerCard";
import { EVENT, LOOP_M, TEAM, RESERVE, HISTORY, COURSE, RACE_DAY } from "@/app/backyard/_data/event";
import { COURSE_ELE } from "@/app/backyard/_data/course-path";

/**
 * Die Startseite läuft die Rennuhr mit: oben Samstag 14:00, unten
 * Sonntagnachmittag. Jede Sektion trägt die Stunde, in der ihr Inhalt
 * tatsächlich passiert – nachts wird es dunkel, nach einem vollen Tag
 * kommt die Wertung, danach das Licht zurück.
 *
 * Was auf einer Unterseite steht, steht hier nicht noch einmal: die
 * Regeln nur auf /rules, die Rennorganisation nur auf /squad.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Course />
      <Squad />
      <Format />
      <Satellite />
      <Dawn from={TONE.tag} to={TONE.daemmerung} />
      <Nightfall />
      <Dawn from={TONE.daemmerung} to={TONE.tief} />
      <Together />
      <Dawn from={TONE.tief} to={TONE.tag} />
      <Scoring />
      <Paper />
      <RaceDay />
      <Partners />
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
            {TEAM.length} runners for Switzerland, {LOOP_M} metres, on the hour. Not in the
            corral at the bell and you are out. Loop not finished inside sixty
            minutes and you are out. The country with the most completed loops wins.
          </p>

          <div className="mt-7 grid max-w-md grid-cols-2 gap-px sm:mt-9 sm:inline-grid">
            <Link
              href="/live"
              className="border px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] sm:px-6 sm:text-[13px]"
              style={{ background: "var(--byd-accent)", color: "#fff", borderColor: "var(--byd-accent)" }}
            >
              Live scoring
            </Link>
            <Link
              href="/squad"
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
        <span className="stamp">↓ The page runs the race clock</span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════ Hour 01 · Saturday 15:00 */

function Format() {
  const facts = [
    {
      n: String(LOOP_M),
      u: "Metres",
      t: "The loop. Out and back along the Lorze, gravel and concrete, 19 metres down and 19 back up. The same one every time.",
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
    <Section hour="tag" stamp="Hour 03 · Sat 17:00">
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
            <span className="stamp">One loop per hour, on the clock</span>
          </div>
          <LoopStrip startISO={EVENT.startISO} />
        </div>
      </Reveal>
    </Section>
  );
}



/* ═══════════════════════════════════ Hour 01 · Saturday 15:00 */

function Course() {
  const numbers = [
    ["Loop length", `${LOOP_M} m`],
    ["Down, then up", `${COURSE_ELE.drop} m`],
    ["Surface", COURSE.surface],
    ["Road crossings", String(COURSE.crossings.length)],
  ];
  return (
    <Section hour="tag" stamp="Hour 01 · Sat 15:00">
      <Reveal>
        <h2 className="display max-w-3xl text-[2rem] sm:text-5xl">
          The same {LOOP_M} metres, sixty times over.
        </h2>
        <p className="mt-6 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Out from the clubhouse along the Lorze, round the cone at 3.3 km and back the
          same way. Shaded, hard underfoot — and not flat: it runs downhill on the way
          out and uphill all the way home.
        </p>
      </Reveal>

      <Reveal>
        <div className="mt-12 grid border-y sm:grid-cols-4 rule">
          {numbers.map(([k, v]) => (
            <div key={k} className="border-b py-8 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 rule">
              <p className="stamp mb-3">{k}</p>
              <p className="display text-[1.8rem] sm:text-[2.2rem]">{v}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-14">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
            <span className="stamp">Elevation, as recorded</span>
            <span className="stamp">{COURSE.elevation}</span>
          </div>
          <CourseProfile />
        </div>
        <Link href="/course" className="stamp mt-10 inline-block underline underline-offset-4">
          The loop in its valley →
        </Link>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 04 · Saturday 18:00 */

function Satellite() {
  return (
    <Section hour="tag" stamp="Hour 04 · Sat 18:00">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[2rem] sm:text-5xl">
            Everyone started at the same second.
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            The world team championship is a satellite race. Every nation runs it at
            home, on its own loop, and the clocks start together. Nobody sees anybody
            else run. Each nation times its own race, and the totals are normally only
            added up afterwards.
          </p>
        </Reveal>
        <Reveal>
          <p className="stamp mb-6">What that means for this page</p>
          <p className="max-w-md text-[15px] leading-relaxed">
            Every nation that publishes its timing feed can be read while the race is
            still on. So we pull them together and add them up ourselves, live. Not
            every nation publishes one — a missing country is not a statement.
          </p>
          <Link href="/world" className="stamp mt-8 inline-block underline underline-offset-4">
            World standings →
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 05 · Saturday 19:00 */

function Nightfall() {
  return (
    <Section hour="daemmerung" stamp="Hour 05 · Sat 19:00">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[2rem] sm:text-5xl">The sun sets at 18:37.</h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            By the fifth bell it is dark, and it stays dark for thirteen hours. Same
            {" "}{LOOP_M} metres, now by headlamp. The two road crossings nobody thought
            about at three in the afternoon are the only places with light.
          </p>
        </Reveal>
        <Reveal>
          <p className="stamp mb-6">Crews are shared</p>
          <p className="max-w-md text-[15px] leading-relaxed">
            There is not enough room in Baar for fifteen separate crews, so they are
            shared. The person handing you a cup is handing the next one a cup too, and
            at four in the morning they have been awake exactly as long as you have.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 14 · Sunday 04:00 */

function Together() {
  return (
    <Section hour="tief" stamp="Hour 14 · Sun 04:00">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[2rem] sm:text-5xl">Nobody here runs for themselves.</h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            In a normal backyard you are on your own and everybody but one loses. Here
            your loop is his loop: every loop any of the fifteen finishes is one point,
            and the points belong to the country. Somebody dropping out does not just
            end their race — it costs a point an hour for the rest of the weekend.
          </p>
        </Reveal>
        <Reveal>
          <p className="stamp mb-6">So this is allowed, and this is not</p>
          <ul className="border-t rule">
            <li className="border-b py-4 text-[15px] leading-relaxed rule">
              Walking the last kilometre next to someone who is falling apart. Allowed.
            </li>
            <li className="border-b py-4 text-[15px] leading-relaxed rule">
              Running a loop as somebody&rsquo;s pacer. Not allowed — it disqualifies them.
            </li>
          </ul>
          <Link href="/rules" className="stamp mt-8 inline-block underline underline-offset-4">
            All the rules →
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 24 · Sunday 14:00 */

function Scoring() {
  return (
    <section data-hour="tag" data-stamp="Hour 24 · Sun 14:00">
      <PinnedTally />
    </section>
  );
}

/* ═══════════════════════════════════ Hour 08 · Saturday 22:00 */

function Squad() {
  const all = [...TEAM, ...RESERVE];
  const best = Math.max(...TEAM.map((a) => a.pb));
  return (
    <Section hour="tag" stamp="Hour 02 · Sat 16:00" wide>
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">
          Nobody in this squad has gone past {best} loops.
        </h2>
        <p className="mt-6 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          The number on each card is the runner&rsquo;s best loop count between 16 August
          2024 and 15 August 2026 — that is what selects the team. Two got in by
          winning a qualifying race outright, a Silver Ticket. The other thirteen came
          off the At Large list, ranked by that number.
        </p>
      </Reveal>

      <div className="mt-14">
        <Rail label={`${all.length} runners · swipe`}>
          {all.map((a) => (
            <RunnerCard key={`${a.first}-${a.name}`} a={a} />
          ))}
        </Rail>
      </div>

      <Reveal>
        <Link href="/squad" className="stamp mt-14 inline-block underline underline-offset-4">
          Full squad, the table and who runs the race →
        </Link>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════ Hour 11 · Sunday 01:00 */

function Paper() {
  return (
    <Section hour="tag" stamp="Hour 26 · Sun 16:00">
      <OnPaper />
      <PastResults />
    </Section>
  );
}

function PastResults() {
  const max = Math.max(...HISTORY.flatMap((h) => [h.ch, h.at, h.de]));
  return (
    <div className="mt-24">
      <Reveal>
        <p className="stamp mb-6">Every championship so far</p>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">
          {HISTORY.map((h) => `${h.year}: ${h.ch}.`).join(" ")}
        </h2>
        <p className="mt-6 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Germany has finished ahead of Switzerland every time, Austria behind every time.
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
                          background: row.hot ? "var(--byd-accent)" : "var(--bar)",
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
    </div>
  );
}

/* ═══════════════════════════════════ Hour 28 · Sunday 18:00 */

function RaceDay() {
  return (
    <Section hour="tag" stamp="Hour 28 · Sun 18:00">
      <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[2rem] sm:text-5xl">Baar, along the Lorze.</h2>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            {COURSE.start}, {COURSE.shape.toLowerCase()}. Two road crossings, both on
            the way out, both marshalled.
          </p>
          <Link href="/course" className="stamp mt-8 inline-block underline underline-offset-4">
            The course in detail →
          </Link>
        </Reveal>

        <Reveal>
          <p className="stamp mb-6">Come and stand there</p>
          <p className="max-w-md text-[15px] leading-relaxed">
            Anyone can watch. It costs nothing, there is nothing to book, and the whole
            thing happens at {COURSE.start}. The bell goes on the hour, every hour —
            that is the minute worth being there for, and it comes back until the race
            is over. Saturday evening is when it gets good. Sunday morning is when it
            gets serious.
          </p>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            Loop counts on this page come straight from the timing system in Baar and
            refresh every thirty seconds. Both boards already run on the real 2024 data,
            so you can see now what they will do on the day.
            {RACE_DAY.streamAnnounced && !RACE_DAY.youtube
              ? " A livestream has been announced; the link goes here as soon as it exists."
              : ""}
          </p>
          <div className="mt-8 border-t rule">
            <RaceLink href="/live" label="Live scoring" note="Team Switzerland, loop by loop" />
            <RaceLink href="/world" label="World standings" note="All nations with a public feed" />
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
