import type { Metadata } from "next";
import PageHead from "@/app/backyard/_components/PageHead";
import Reveal from "@/app/backyard/_components/Reveal";
import { TEAM, RESERVE, STAFF } from "@/app/backyard/_data/event";

export const metadata: Metadata = {
  title: "Squad",
  description: "The fifteen runners of Team Switzerland 2026 and the people running the race.",
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

      <section data-hour="tag" data-stamp="Squad" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          <div className="border-t rule">
            <div className="hidden grid-cols-[3rem_1fr_9rem_5rem_5rem_10rem] items-baseline gap-4 border-b py-3 sm:grid rule">
              <span className="stamp">Pos</span>
              <span className="stamp">Name</span>
              <span className="stamp">Route in</span>
              <span className="stamp text-right">Qual</span>
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
            Where Best is higher than Qual, the runner&rsquo;s best race was before the
            qualifying window. Matteo Tenchio: 61 loops.
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
              <div className="grid border-b sm:grid-cols-4 rule">
                {RESERVE.map((a) => (
                  <div key={a.name} className="border-b py-6 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 rule">
                    <p className="text-[15px] font-medium uppercase tracking-tight">
                      {a.first} {a.name}
                    </p>
                    <p className="mt-2 font-mono text-sm tnum" style={{ color: "var(--byd-mute)" }}>
                      {a.qual} loops
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

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
