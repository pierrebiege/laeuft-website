import Link from "next/link";
import Dial from "@/app/backyard/_components/Dial";
import Reveal from "@/app/backyard/_components/Reveal";
import Rail from "@/app/backyard/_components/Rail";
import PinnedTally from "@/app/backyard/_components/PinnedTally";
import Section, { Dawn, TONE } from "@/app/backyard/_components/Section";
import CourseTerrain from "@/app/backyard/_components/CourseTerrain";
import OnPaper from "@/app/backyard/_components/OnPaper";
import Partners from "@/app/backyard/_components/Partners";
import RunnerCard from "@/app/backyard/_components/RunnerCard";
import { EVENT, LOOP_M, TEAM, RESERVE, HISTORY, COURSE, RACE_DAY } from "@/app/backyard/_data/event";

/**
 * Die Seite wird in der Mitte dunkel und am Ende wieder hell – wie das
 * Rennen, das durch eine Nacht geht. Das ist Atmosphäre, keine Angabe:
 * Stundenstempel standen hier einmal, aber nachdem Strecke und Team nach
 * vorne gerückt sind, liesse sich die Reihenfolge nicht mehr ehrlich als
 * Rennstunden lesen.
 *
 * Was auf einer Unterseite steht, steht hier nicht noch einmal: die
 * Regeln nur auf /rules, die Rennorganisation nur auf /squad.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Format />
      <Valley />
      <Squad />
      <Satellite />
      <Dawn from={TONE.tag} to={TONE.nacht} />
      <Nightfall />
      <Together />
      <Dawn from={TONE.nacht} to={TONE.tag} />
      <Scoring />
      <Paper />
      <RaceDay />
      <Partners />
    </>
  );
}

function Hero() {
  return (
    <section
      data-hour="tag"
      data-stamp="Team Switzerland"
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
            <span style={{ color: "var(--byd-accent)" }}>Last one standing.</span>
            <br />
            One loop.
            <br />
            Every hour.
          </h1>

          <p className="mt-6 max-w-md text-sm leading-relaxed sm:mt-8 sm:text-[15px]" style={{ color: "var(--byd-mute)" }}>
            {TEAM.length} runners for Switzerland, {LOOP_M} metres, every hour. Not in the
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
        <span className="stamp">Free to watch</span>
      </div>
    </section>
  );
}

function Format() {
  const facts = [
    {
      n: String(LOOP_M),
      u: "Metres",
      t: `The loop. Out from the clubhouse along the Lorze, round the cone at 3.3 km and back the same way. ${COURSE.surface}, ${COURSE.elevation}. The same loop every hour.`,
    },
    {
      n: "60",
      u: "Minutes",
      t: "That is all there is. Run the loop in less and you get time to eat, change, sleep and recover.",
    },
    {
      n: "15",
      u: "Runners",
      t: "All countries start with 15 runners locally, at the same time, wherever they are in the world.",
    },
  ];

  return (
    <Section hour="tag" stamp="The loop">
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

    </Section>
  );
}



function Valley() {
  return (
    <>
      <section data-hour="tag" data-stamp="The loop from above">
        <CourseTerrain />
      </section>
      <section data-hour="tag" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          <Link href="/course" className="stamp inline-block underline underline-offset-4">
            The course in detail — crossings, surface, what it is like on site →
          </Link>
        </div>
      </section>
    </>
  );
}

function Satellite() {
  return (
    <Section hour="tag" stamp="The satellite race">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[2rem] sm:text-5xl">
            Everyone starts at the same second.
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            The world team championship is a satellite race. Nobody sees anybody else
            run: every nation starts in its own yard, at the same time, and times its
            own race.
          </p>
        </Reveal>
        <Reveal>
          <p className="stamp mb-6">What that means for this page</p>
          <p className="max-w-md text-[15px] leading-relaxed">
            Where a nation publishes its timing feed, the numbers can be read while the
            race is still on. So we pull them together and add them up ourselves, live. Not
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

function Nightfall() {
  return (
    <Section hour="nacht" stamp="After dark">
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

function Together() {
  return (
    <Section hour="nacht" stamp="Nobody runs alone" tight>
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[2rem] sm:text-5xl">Nobody here runs for themselves.</h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            In a normal backyard you are on your own, and only one runner wins. Here
            your loop counts for all of them: every loop any of the fifteen finishes is
            a point, and the points belong to the country.
          </p>
        </Reveal>
        <Reveal>
          <p className="stamp mb-6">So this is allowed, and this is not</p>
          <ul className="border-t rule">
            <li className="border-b py-4 text-[15px] leading-relaxed rule">
              Walking the last kilometre next to a team mate who is suffering. Allowed.
            </li>
            <li className="border-b py-4 text-[15px] leading-relaxed rule">
              An outsider pacing someone from the team. Not allowed — they get disqualified.
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

function Scoring() {
  return (
    <section data-hour="tag" data-stamp="Scoring">
      <PinnedTally />
    </section>
  );
}

function Squad() {
  const all = [...TEAM, ...RESERVE];
  const best = Math.max(...TEAM.map((a) => a.pb));
  return (
    <Section hour="tag" stamp="The squad" wide>
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">
          This squad has already run {best} loops.
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

function Paper() {
  return (
    <Section hour="tag" stamp="On paper">
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
          Switzerland has been ahead of Austria every time, and 2024 was the best year yet — 128 loops more than 2020.
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

function RaceDay() {
  return (
    <Section hour="tag" stamp="Race day">
      <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[2rem] sm:text-5xl">Baar, along the Lorze.</h2>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            {COURSE.start}, {COURSE.shape.toLowerCase()}. {COURSE.surface.toLowerCase()},
            mostly shaded.
          </p>
          <Link href="/course" className="stamp mt-8 inline-block underline underline-offset-4">
            The course in detail →
          </Link>
        </Reveal>

        <Reveal>
          <p className="stamp mb-6">Come and watch</p>
          <p className="max-w-md text-[15px] leading-relaxed">
            Come and cheer the team on, we need any support we can get. The first
            twenty-four hours are just the warm-up — drop in whenever it suits you,
            day or night.
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
