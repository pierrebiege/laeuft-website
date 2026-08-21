import Link from "next/link";
import Dial from "@/app/backyard/_components/Dial";
import Reveal from "@/app/backyard/_components/Reveal";
import Rail from "@/app/backyard/_components/Rail";
import PinnedTally from "@/app/backyard/_components/PinnedTally";
import Section, { Dawn, TONE } from "@/app/backyard/_components/Section";
import { EVENT, TEAM, RESERVE, HISTORY, RULES, COURSE, STAFF } from "@/app/backyard/_data/event";

export default function Home() {
  return (
    <>
      <Hero />
      <Start />
      <Dawn from={TONE.tag} to={TONE.daemmerung} />
      <Rechnung />
      <Dawn from={TONE.daemmerung} to={TONE.nacht} />
      <Kader />
      <Nacht />
      <Tiefpunkt />
      <Dawn from={TONE.tief} to={TONE.tag} />
      <Morgen />
    </>
  );
}

/* ═══════════════════════════════════ Stunde 00 · Samstag 14:00 */

function Hero() {
  return (
    <section
      data-hour="tag"
      data-stamp="Stunde 00 · Sa 14:00 · Start"
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
            Eine Runde.
            <br />
            Jede Stunde.
            <br />
            <span style={{ color: "var(--byd-accent)" }}>Bis niemand mehr kann.</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-relaxed sm:mt-8 sm:text-[15px]" style={{ color: "var(--byd-mute)" }}>
            Fünfzehn Schweizerinnen und Schweizer, 6706 Meter, jede volle Stunde neu.
            Kein Ziel, keine Zwischenwertung, keine Ausreden. Wer die Runde nicht in
            sechzig Minuten schafft, ist raus. Am Schluss zählt, wie viele Runden
            das Land zusammenbringt.
          </p>

          <div className="mt-7 grid max-w-md grid-cols-2 gap-px sm:mt-9 sm:inline-grid">
            <Link
              href="/backyard/live"
              className="border px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] sm:px-6 sm:text-[13px]"
              style={{ background: "var(--byd-accent)", color: "#fff", borderColor: "var(--byd-accent)" }}
            >
              Live mitverfolgen
            </Link>
            <Link
              href="/backyard/team"
              className="border px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] sm:px-6 sm:text-[13px] rule"
            >
              Die fünfzehn
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Dial startISO={EVENT.startISO} size={340} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[76rem] items-baseline justify-between border-t pt-4 rule">
        <span className="stamp">Sa 17. Oktober 2026</span>
        <span className="stamp hidden sm:block">Vereinshaus SV Baar</span>
        <span className="stamp">Scrollen ↓</span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════ Stunde 01 · Samstag 15:00 */

function Start() {
  const facts = [
    { n: "6706", u: "Meter", t: "Die Runde. Out and back der Lorze entlang, Kies und Beton, dreissig Höhenmeter. Immer dieselbe." },
    { n: "60", u: "Minuten", t: "Mehr Zeit gibt es nicht. Wer eine Runde in fünfzig läuft, hat zehn Minuten Pause. Mehr nicht." },
    { n: "15", u: "Läufer", t: "Keine Kategorien, kein Geschlechterfeld, keine Altersklassen. Alle laufen dieselbe Runde zur selben Sekunde." },
  ];

  return (
    <Section hour="tag" stamp="Stunde 01 · Sa 15:00" title="Das Format">
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">
          Kein Ziel. Nur eine Glocke, die jede Stunde neu läutet.
        </h2>
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

/* ═══════════════════════════════════ Stunde 05 · Samstag 19:00 */

function Rechnung() {
  return (
    <section data-hour="daemmerung" data-stamp="Stunde 05 · Sa 19:00 · Die Rechnung">
      <PinnedTally />
    </section>
  );
}

/* ═══════════════════════════════════ Stunde 08 · Samstag 22:00 */

function Kader() {
  const all = [...TEAM, ...RESERVE];
  return (
    <Section hour="nacht" stamp="Stunde 08 · Sa 22:00" title="Der Kader" wide>
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">
          Fünfzehn Namen. Alle gleich gross gesetzt.
        </h2>
        <p className="mt-6 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Die Zahl ist die beste Rundenzahl im Fenster vom 16. August 2024 bis zum
          15. August 2026. Zwei Plätze gingen an Silver-Ticket-Sieger, der Rest an
          die At-Large-Liste. Ab dem Glockenschlag spielt beides keine Rolle mehr.
        </p>
      </Reveal>

      <div className="mt-14">
        <Rail label="15 im Kader · ziehen oder blättern">
          {all.map((a) => (
            <article
              key={`${a.first}-${a.name}`}
              className="flex h-56 flex-col justify-between border-l p-6 rule"
              style={{ opacity: a.status === "reserve" ? 0.55 : 1 }}
            >
              <div className="flex items-start justify-between">
                <span className="stamp">
                  {a.status === "reserve" ? "Reserve" : String(a.pos).padStart(2, "0")}
                </span>
                <span className="stamp">{a.status === "silver" ? "Silver Ticket" : ""}</span>
              </div>
              <div>
                <p className="text-xl font-semibold uppercase leading-tight tracking-[-0.01em]">
                  {a.first}
                  <br />
                  {a.name}
                </p>
              </div>
              <div className="flex items-baseline justify-between border-t pt-3 rule">
                <span className="stamp">Runden</span>
                <span className="display tnum text-3xl">{a.qual}</span>
              </div>
            </article>
          ))}
        </Rail>
      </div>

      <Reveal>
        <div className="mt-14 grid gap-x-10 gap-y-4 border-t pt-8 sm:grid-cols-2 lg:grid-cols-4 rule">
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
        <Link href="/backyard/team" className="stamp mt-8 inline-block underline underline-offset-4">
          Ganzer Kader mit Bestleistungen →
        </Link>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════ Stunde 14 · Sonntag 04:00 */

function Nacht() {
  return (
    <Section hour="tief" stamp="Stunde 14 · So 04:00" title="Die Regeln">
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">
          Um vier Uhr morgens sind die Regeln das Einzige, was noch klar ist.
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
          <p className="stamp mb-6">Teamarbeit</p>
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
          <Link href="/backyard/format" className="stamp mt-8 inline-block underline underline-offset-4">
            Alle Regeln →
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════ Stunde 18 · Sonntag 08:00 */

function Tiefpunkt() {
  const max = Math.max(...HISTORY.flatMap((h) => [h.ch, h.at, h.de]));
  return (
    <Section hour="tief" stamp="Stunde 18 · So 08:00" title="Wo wir herkommen">
      <Reveal>
        <h2 className="display max-w-2xl text-[2rem] sm:text-5xl">
          2020: 373. 2022: 360. 2024: 501.
        </h2>
        <p className="mt-6 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Deutschland war jedes Mal vor uns. Österreich jedes Mal knapp dahinter.
          2026 steht nichts davon fest.
        </p>
      </Reveal>

      <div className="mt-14 border-t rule">
        {HISTORY.map((h) => (
          <Reveal key={h.year}>
            <div className="grid items-center gap-6 border-b py-7 sm:grid-cols-[5rem_1fr] rule">
              <p className="display tnum text-2xl">{h.year}</p>
              <div>
                {[
                  { l: "Schweiz", v: h.ch, hot: true },
                  { l: "Deutschland", v: h.de, hot: false },
                  { l: "Österreich", v: h.at, hot: false },
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
              <span className="stamp w-24 shrink-0">Schweiz</span>
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

/* ═══════════════════════════════════ Stunde 26 · Sonntag 16:00 */

function Morgen() {
  return (
    <Section hour="tag" stamp="Stunde 26 · So 16:00" title="Die Strecke und der Rest">
      <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[2rem] sm:text-5xl">
            Baar, der Lorze entlang.
          </h2>
          <dl className="mt-10 border-t rule">
            {[
              ["Start und Ziel", COURSE.start],
              ["Form", COURSE.shape],
              ["Untergrund", COURSE.surface],
              ["Höhenmeter", COURSE.elevation],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 border-b py-4 rule">
                <dt className="stamp shrink-0">{k}</dt>
                <dd className="text-right text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
          <Link href="/backyard/strecke" className="stamp mt-8 inline-block underline underline-offset-4">
            Details zur Strecke →
          </Link>
        </Reveal>

        <Reveal>
          <p className="stamp mb-6">Am Renntag</p>
          <p className="display text-[2rem] sm:text-4xl">
            Du siehst jede Runde in dem Moment, in dem sie fällt.
          </p>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            Der Rundenstand kommt direkt aus der Zeitmessung in Baar. Daneben läuft
            der Weltstand mit allen Nationen, die ihre Daten öffentlich stellen.
            Beides kannst du schon heute testen, mit den echten Zahlen von 2024.
          </p>
          <div className="mt-9 flex flex-wrap gap-px">
            <Link
              href="/backyard/live"
              className="border px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em]"
              style={{ background: "var(--byd-accent)", color: "#fff", borderColor: "var(--byd-accent)" }}
            >
              Live-Board
            </Link>
            <Link
              href="/backyard/welt"
              className="border px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] rule"
            >
              Weltstand
            </Link>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
