import type { Metadata } from "next";
import PageHead from "@/app/backyard/_components/PageHead";
import Reveal from "@/app/backyard/_components/Reveal";
import RunnerCard from "@/app/backyard/_components/RunnerCard";
import Rail from "@/app/backyard/_components/Rail";
import OnPaper from "@/app/backyard/_components/OnPaper";
import { TEAM, RESERVE, STAFF, pastResults } from "@/app/backyard/_data/event";

export const metadata: Metadata = {
  title: "Squad",
  description: "The fifteen runners of Team Switzerland 2026, their qualifying results, past team championships and the people running the race.",
};

export default function SquadPage() {
  const max = Math.max(...TEAM.map((a) => a.qual));

  return (
    <>
      <PageHead
        hour="tag"
        stamp="Squad · as of 19 August 2026 · qualifying closed"
        title="The fifteen"
        lead="Qualifying ran from 16 August 2024 to 15 August 2026. Two places came from Silver Ticket wins, thirteen from the At Large list."
      />

      {/* Porträts: auf dem Handy eine Bahn zum Wischen, ab Tablet ein Raster */}
      <section data-hour="tag" data-stamp="Squad" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          <div className="sm:hidden">
            <Rail label="15 runners · swipe">
              {TEAM.map((a) => (
                <RunnerCard key={a.name} a={a} />
              ))}
            </Rail>
          </div>
          <div className="hidden grid-cols-3 gap-px border-y sm:grid lg:grid-cols-5 rule">
            {TEAM.map((a) => (
              <RunnerCard key={a.name} a={a} compact />
            ))}
          </div>
        </div>
      </section>

      {/* Tabelle */}
      <section data-hour="tag" data-stamp="Squad · table" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          <div className="mb-6 border-b pb-4 rule">
            <span className="stamp">All fifteen, as a list</span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[760px] border-t rule">
              <div className="grid grid-cols-[3rem_1fr_8rem_4.5rem_4.5rem_12rem_8rem] items-baseline gap-4 border-b py-3 rule">
                <span className="stamp">Pos</span>
                <span className="stamp">Name</span>
                <span className="stamp">Route in</span>
                <span className="stamp text-right">Qual</span>
                <span className="stamp text-right">Best</span>
                <span className="stamp">Team championships</span>
                <span className="stamp"></span>
              </div>

              {TEAM.map((a) => {
                const past = pastResults(a);
                return (
                  <div
                    key={a.name}
                    className="grid grid-cols-[3rem_1fr_8rem_4.5rem_4.5rem_12rem_8rem] items-baseline gap-4 border-b py-4 rule"
                  >
                    <span className="font-mono text-xs tnum" style={{ color: "var(--byd-mute)" }}>
                      {String(a.pos).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] font-medium uppercase tracking-tight">
                      {a.first} {a.name}
                      {a.role && <span className="stamp ml-3">{a.role}</span>}
                    </span>
                    <span className="stamp">{a.status === "silver" ? "Silver Ticket" : "At Large"}</span>
                    <span className="text-right font-mono text-sm tnum">{a.qual}</span>
                    <span className="text-right font-mono text-sm tnum" style={{ color: "var(--byd-mute)" }}>
                      {a.pb}
                    </span>
                    <span className="font-mono text-xs tnum" style={{ color: "var(--byd-mute)" }}>
                      {past.length ? past.map((r) => `${r.year}: ${r.laps}`).join(" · ") : "first time"}
                    </span>
                    <span className="flex h-2 items-center">
                      <span
                        className="block h-full"
                        style={{ width: `${(a.qual / max) * 100}%`, background: "var(--byd-accent)" }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-5 text-xs" style={{ color: "var(--byd-mute)" }}>
            Where Best is higher than Qual, the runner&rsquo;s best race was before the
            qualifying window. Team championship loop counts from the 2020, 2022 and 2024 Swiss results.
          </p>
        </div>
      </section>

      {RESERVE.length > 0 && (
        <section data-hour="tag" data-stamp="Reserve" className="px-5 pb-24">
          <div className="mx-auto max-w-[76rem]">
            <Reveal>
              <div className="border-b pb-4 rule">
                <span className="stamp">Reserve</span>
              </div>
              <div className="sm:hidden">
                <Rail label="Reserve · swipe">
                  {RESERVE.map((a) => (
                    <RunnerCard key={a.name} a={a} />
                  ))}
                </Rail>
              </div>
              <div className="hidden gap-px border-b sm:grid sm:grid-cols-4 rule">
                {RESERVE.map((a) => (
                  <RunnerCard key={a.name} a={a} compact />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section data-hour="nacht" data-stamp="What the numbers say" className="px-5 py-24">
        <div className="mx-auto max-w-[76rem]">
          <OnPaper />
        </div>
      </section>

      <section data-hour="daemmerung" data-stamp="Race organisation" className="px-5 py-24">
        <div className="mx-auto max-w-[76rem]">
          <Reveal>
            <div className="border-b pb-4 rule">
              <span className="stamp">Race organisation</span>
            </div>
            <div className="mt-10 grid border-t sm:grid-cols-2 lg:grid-cols-4 rule">
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
