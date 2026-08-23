import type { Metadata } from "next";
import PageHead from "@/app/backyard/_components/PageHead";
import Reveal from "@/app/backyard/_components/Reveal";
import LoopStrip from "@/app/backyard/_components/LoopStrip";
import { COURSE, EVENT } from "@/app/backyard/_data/event";

export const metadata: Metadata = {
  title: "Course",
  description: "The championship loop in Baar ZG: 6706 metres out and back along the Lorze.",
};

const NUMBERS = [
  ["Loop length", "6706 m"],
  ["Climb", "≈ 30 m"],
  ["Surface", "Gravel / concrete"],
  ["Road crossings", "2"],
];

export default function CoursePage() {
  return (
    <>
      <PageHead
        hour="tag"
        stamp="Course · Vereinshaus SV Baar · Canton Zug"
        title="6706 metres, out and back."
        lead="From the clubhouse along the Lorze to the turnaround and back. Flat, shaded, hard underfoot."
      />

      <section data-hour="tag" data-stamp="Course" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          <div className="grid border-y sm:grid-cols-4 rule">
            {NUMBERS.map(([k, v]) => (
              <div key={k} className="border-b py-8 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 rule">
                <p className="stamp mb-3">{k}</p>
                <p className="display text-[1.8rem] sm:text-[2.2rem]">{v}</p>
              </div>
            ))}
          </div>

          <Reveal>
            <div className="mt-16">
              <div className="mb-5 flex items-baseline justify-between gap-6">
                <span className="stamp">The loop, to scale</span>
                <span className="stamp">One loop per hour, on the clock</span>
              </div>
              <LoopStrip startISO={EVENT.startISO} />
            </div>
          </Reveal>

          <div className="mt-16 grid gap-x-16 gap-y-14 lg:grid-cols-2">
            <Reveal>
              <p className="stamp mb-6">The two crossings</p>
              <ol className="border-t rule">
                {COURSE.crossings.map((c, i) => (
                  <li key={c} className="flex gap-6 border-b py-5 rule">
                    <span className="display text-2xl" style={{ color: "var(--byd-accent)" }}>
                      {i + 1}
                    </span>
                    <p className="pt-1 text-[15px] leading-relaxed">{c}</p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal>
              <p className="stamp mb-6">On site</p>
              <ul className="border-t rule">
                {COURSE.notes.map((n) => (
                  <li key={n} className="border-b py-5 text-[15px] leading-relaxed rule">
                    {n}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal>
            <div className="mt-16 border rule">
              <iframe
                title="Course map, Baar"
                className="h-[440px] w-full"
                loading="lazy"
                src="https://www.openstreetmap.org/export/embed.html?bbox=8.505%2C47.190%2C8.545%2C47.215&layer=mapnik&marker=47.1993%2C8.5237"
              />
            </div>
            <p className="mt-4 text-xs" style={{ color: "var(--byd-mute)" }}>
              Baar, start and finish at Vereinshaus SV Baar. Map data OpenStreetMap.
              The exact route follows once the GPX is available.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
