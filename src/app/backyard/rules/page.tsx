import type { Metadata } from "next";
import PageHead from "@/app/backyard/_components/PageHead";
import Reveal from "@/app/backyard/_components/Reveal";
import { RULES } from "@/app/backyard/_data/event";

export const metadata: Metadata = {
  title: "Rules",
  description: "Scoring, backyard rules and what teamwork means at the team championship.",
};

const BLOCKS = [
  { stamp: "Scoring", title: "One loop, one point.", items: RULES.scoring, accent: true },
  { stamp: "Backyard", title: "The same everywhere in the world.", items: RULES.backyard },
  { stamp: "Teamwork", title: "Help each other get far.", items: RULES.teamwork },
];

export default function RulesPage() {
  return (
    <>
      <PageHead
        hour="tief"
        stamp="Rules · 6706 m · on the hour · last one standing"
        title="Two ways out: the bell, or the hour."
        lead="At the bell the whole field is in the corral. Not in it, you are out. Loop not finished inside sixty minutes, you are out. There is not much more to it."
      />

      <section data-hour="tief" data-stamp="Rules" className="px-5 pb-28">
        <div className="mx-auto max-w-[76rem] space-y-20">
          {BLOCKS.map((b) => (
            <Reveal key={b.stamp}>
              <div className="grid gap-8 border-t pt-8 lg:grid-cols-[20rem_1fr] lg:gap-16 rule">
                <div>
                  <p className="stamp mb-4">{b.stamp}</p>
                  <h2
                    className="display text-[1.8rem] sm:text-4xl"
                    style={b.accent ? { color: "var(--byd-accent)" } : undefined}
                  >
                    {b.title}
                  </h2>
                </div>
                <ol>
                  {b.items.map((t, i) => (
                    <li key={t} className="flex gap-6 border-b py-5 first:border-t rule">
                      <span className="font-mono text-[11px] tnum pt-1" style={{ color: "var(--byd-mute)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[15px] leading-relaxed">{t}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          ))}

          <Reveal>
            <div className="border-y py-14 text-center rule">
              <p className="display text-[1.6rem] sm:text-3xl">
                &laquo;If we have fun, we will run longer.&raquo;
              </p>
              <p className="stamp mt-5">From the team briefing</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
