import type { Metadata } from "next";
import PageHead from "@/app/backyard/_components/PageHead";
import Reveal from "@/app/backyard/_components/Reveal";
import { TEAM, RESERVE, STAFF } from "@/app/backyard/_data/event";

export const metadata: Metadata = {
  title: "Kader",
  description: "Die fünfzehn Läuferinnen und Läufer von Team Schweiz 2026, Reserve und Staff.",
};

export default function TeamPage() {
  const max = Math.max(...TEAM.map((a) => a.qual));

  return (
    <>
      <PageHead
        hour="tag"
        stamp="Kader · Stand 19. August 2026 · Qualifikation geschlossen"
        title="Die fünfzehn."
        lead="Qualifikationsfenster 16. August 2024 bis 15. August 2026. Zwei Plätze über Silver Tickets, dreizehn über die At-Large-Liste. Ab dem Glockenschlag zählt keine dieser Zahlen mehr."
      />

      <section data-hour="tag" data-stamp="Kader" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          {/* Ein Startlistenblatt: alle Zeilen gleich hoch, gleiche Schriftgrösse. */}
          <div className="border-t rule">
            <div className="hidden grid-cols-[3rem_1fr_9rem_5rem_5rem_10rem] items-baseline gap-4 border-b py-3 sm:grid rule">
              <span className="stamp">Pos</span>
              <span className="stamp">Name</span>
              <span className="stamp">Weg ins Team</span>
              <span className="stamp text-right">Quali</span>
              <span className="stamp text-right">Best</span>
              <span className="stamp"></span>
            </div>

            {TEAM.map((a) => (
              <div
                key={a.name}
                className="grid grid-cols-[2.5rem_1fr_4rem] items-baseline gap-4 border-b py-4 sm:grid-cols-[3rem_1fr_9rem_5rem_5rem_10rem] rule"
              >
                <span className="font-mono text-xs tnum" style={{ color: "var(--byd-mute)" }}>
                  {String(a.pos).padStart(2, "0")}
                </span>
                <span className="text-[15px] font-medium uppercase tracking-tight">
                  {a.first} {a.name}
                  {a.role && <span className="stamp ml-3">{a.role}</span>}
                </span>
                <span className="stamp hidden sm:block">
                  {a.status === "silver" ? "Silver Ticket" : "At Large"}
                </span>
                <span className="text-right font-mono text-sm tnum">{a.qual}</span>
                <span className="hidden text-right font-mono text-sm tnum sm:block" style={{ color: "var(--byd-mute)" }}>
                  {a.pb}
                </span>
                <span className="hidden h-2 items-center sm:flex">
                  <span
                    className="block h-full"
                    style={{ width: `${(a.qual / max) * 100}%`, background: "var(--byd-accent)" }}
                  />
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs" style={{ color: "var(--byd-mute)" }}>
            Steht bei «Best» eine höhere Zahl als bei «Quali», liegt der beste Lauf
            vor dem Qualifikationsfenster. Matteo Tenchio: 61 Runden.
          </p>
        </div>
      </section>

      {RESERVE.length > 0 && (
      <section data-hour="tag" data-stamp="Reserve" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          <Reveal>
            <div className="border-b pb-4 rule">
              <span className="stamp">Reserve · rückt nach, wenn jemand ausfällt</span>
            </div>
            <div className="grid border-b sm:grid-cols-4 rule">
              {RESERVE.map((a) => (
                <div key={a.name} className="border-b py-6 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 rule">
                  <p className="text-[15px] font-medium uppercase tracking-tight">
                    {a.first} {a.name}
                  </p>
                  <p className="mt-2 font-mono text-sm tnum" style={{ color: "var(--byd-mute)" }}>
                    {a.qual} Runden
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      )}

      <section data-hour="daemmerung" data-stamp="Staff" className="px-5 py-24">
        <div className="mx-auto max-w-[76rem]">
          <Reveal>
            <div className="border-b pb-4 rule">
              <span className="stamp">Wer das Rennen trägt</span>
            </div>
            <h2 className="display mt-10 max-w-2xl text-[2rem] sm:text-4xl">
              Vier Leute, ohne die niemand eine Runde läuft.
            </h2>
            <div className="mt-12 grid border-t sm:grid-cols-2 lg:grid-cols-4 rule">
              {STAFF.map((s) => (
                <div key={s.name} className="border-b py-7 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0 rule">
                  <p className="stamp mb-3">{s.role}</p>
                  <p className="text-lg font-semibold uppercase tracking-tight">{s.name}</p>
                  <ul className="mt-4 space-y-1.5">
                    {s.does.map((d) => (
                      <li key={d} className="text-sm" style={{ color: "var(--byd-mute)" }}>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
