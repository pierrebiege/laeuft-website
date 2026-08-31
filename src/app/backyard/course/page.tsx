import type { Metadata } from "next";
import PageHead from "@/app/backyard/_components/PageHead";
import Reveal from "@/app/backyard/_components/Reveal";
import CourseScroll from "@/app/backyard/_components/CourseScroll";
import CourseProfile from "@/app/backyard/_components/CourseProfile";
import { COURSE } from "@/app/backyard/_data/event";
import { COURSE_BBOX, COURSE_ELE, COURSE_START } from "@/app/backyard/_data/course-path";

export const metadata: Metadata = {
  title: "Course",
  description:
    "The championship loop in Baar ZG: 6706 metres out and back along the Lorze — downhill to the turnaround, uphill all the way home.",
};

const NUMBERS = [
  ["Loop length", "6706 m"],
  ["Down, then up", `${COURSE_ELE.drop} m`],
  ["Surface", "Gravel / concrete"],
  ["Road crossings", String(COURSE.crossings.length)],
];

export default function CoursePage() {
  return (
    <>
      <PageHead
        hour="tag"
        stamp="Course · Vereinshaus SV Baar · Canton Zug"
        title="6706 metres, out and back."
        lead="From the clubhouse along the Lorze to the turnaround and back. Shaded, hard underfoot — and tilted: down on the way out, up on the way home."
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
      <section data-hour="tag" data-stamp="Course · the loop">
        <CourseScroll />
      </section>

      <section data-hour="tag" data-stamp="Course" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          <Reveal>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
              <span className="stamp">Elevation, as recorded</span>
              <span className="stamp">{COURSE.elevation}</span>
            </div>
            <CourseProfile />
            <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed">
              The loop is not flat. It runs downhill to the turnaround and back up the whole
              way home, so every single loop ends on the climb — with the bell already in
              earshot. Nineteen metres is nothing in the first yard and something else
              entirely in the thirtieth.
            </p>
          </Reveal>

          <div className="mt-20 grid gap-x-16 gap-y-14 lg:grid-cols-2">
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

          <Reveal>
            <div className="mt-16 border rule">
              <iframe
                title="Course map, Baar"
                className="h-[440px] w-full"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${COURSE_BBOX.join("%2C")}&layer=mapnik&marker=${COURSE_START.lat}%2C${COURSE_START.lon}`}
              />
            </div>
            <p className="mt-4 text-xs" style={{ color: "var(--byd-mute)" }}>
              Start and finish at Vereinshaus SV Baar, marked. The frame follows the
              recorded course. Map data OpenStreetMap. The loop above is Doron De
              Wolf&rsquo;s GPX, one recorded lap.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
