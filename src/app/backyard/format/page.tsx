import type { Metadata } from "next";
import PageHead from "@/app/backyard/_components/PageHead";
import Reveal from "@/app/backyard/_components/Reveal";
import { RULES } from "@/app/backyard/_data/event";

export const metadata: Metadata = {
  title: "Format",
  description: "Wertung, Backyard-Regeln und was Teamarbeit bei der Team-WM konkret heisst.",
};

const BLOCKS = [
  { stamp: "Wertung", title: "Eine Runde ist ein Punkt.", items: RULES.scoring, accent: true },
  { stamp: "Backyard", title: "Was überall auf der Welt gleich gilt.", items: RULES.backyard },
  { stamp: "Teamarbeit", title: "Helfen wir uns, kommen wir weiter.", items: RULES.teamwork },
];

export default function FormatPage() {
  return (
    <>
      <PageHead
        hour="tief"
        stamp="Format · 6706 m · jede volle Stunde · last one standing"
        title="Die Glocke entscheidet, nicht die Uhr."
        lead="Zum Glockenschlag steht das ganze Feld im Corral. Wer nicht drinsteht, ist raus. Wer die Runde nicht in sechzig Minuten schafft, ist raus. Viel mehr Regeln braucht es nicht."
      />

      <section data-hour="tief" data-stamp="Format" className="px-5 pb-28">
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
            <div className="border-y py-16 text-center rule">
              <p className="display text-[1.8rem] sm:text-4xl">
                «Haben wir Spass, laufen wir länger.»
              </p>
              <p className="stamp mt-5">Aus dem Team-Briefing. Steht da wirklich so.</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
