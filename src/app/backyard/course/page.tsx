import type { Metadata } from "next";
import PageHead from "@/app/backyard/_components/PageHead";
import Reveal from "@/app/backyard/_components/Reveal";
import CourseTerrain from "@/app/backyard/_components/CourseTerrain";
import { COURSE, LOOP_M } from "@/app/backyard/_data/event";
import { COURSE_ELE } from "@/app/backyard/_data/course-path";

export const metadata: Metadata = {
  title: "Course",
  description:
    "The championship loop in Baar ZG: 6706 metres out and back along the Lorze — downhill to the turnaround, uphill all the way home.",
};

const NUMBERS = [
  [`Loop length`, `${LOOP_M} m`],
  ["Down, then up", `${COURSE_ELE.drop} m`],
  ["Surface", COURSE.surface],
  ["Road crossings", String(COURSE.crossings.length)],
];

export default function CoursePage() {
  return (
    <>
      <PageHead
        hour="tag"
        stamp="Course · Vereinshaus SV Baar · Canton Zug"
        title={`${LOOP_M} metres, out and back.`}
        lead="From the clubhouse along the Lorze to the turnaround and back. Shaded, hard underfoot — and never flat: downhill on the way out, uphill all the way home."
      />

      <section data-hour="tag" data-stamp="Course" className="px-5">
        <div className="mx-auto max-w-[76rem]">
          <div className="grid border-y sm:grid-cols-4 rule">
            {NUMBERS.map(([k, v]) => (
              <div key={k} className="border-b py-8 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 rule">
                <p className="stamp mb-3">{k}</p>
                <p className="display text-[1.8rem] sm:text-[2.2rem]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Die echte Runde, aus Dorons GPX – Scrollen läuft sie ab. */}
      <section data-hour="tag" data-stamp="Course · the loop from above">
        <CourseTerrain />
      </section>

      <section data-hour="tag" data-stamp="Course" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
            <Reveal>
              <p className="stamp mb-6">The two crossings</p>
              <ol className="border-t rule">
                {COURSE.crossings.map((c, i) => (
                  <li key={c.m} className="flex gap-6 border-b py-5 rule">
                    <span className="display text-2xl" style={{ color: "var(--byd-accent)" }}>
                      {i + 1}
                    </span>
                    <p className="pt-1 text-[15px] leading-relaxed">{c.text}</p>
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

        </div>
      </section>
    </>
  );
}
