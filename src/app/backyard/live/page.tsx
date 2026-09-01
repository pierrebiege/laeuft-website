import type { Metadata } from "next";
import LiveBoard from "@/app/backyard/_components/LiveBoard";
import LiveFeed from "@/app/backyard/_components/LiveFeed";
import PageHead from "@/app/backyard/_components/PageHead";

export const metadata: Metadata = {
  title: "Live",
  description: "Loop count for Team Switzerland in real time, straight from the timing system in Baar.",
};

export default function LivePage() {
  return (
    <>
      <PageHead
        hour="nacht"
        stamp="Live · Baar ZG · Sat 17 October 2026, 14:00"
        title="Live scoring"
        lead="One loop is one point, so the loop count is the score. It comes straight from the timing system and refreshes every thirty seconds. Further down you can write to the fifteen — the messages get read out at the tent."
      />
      <section data-hour="nacht" data-stamp="Live" className="px-5 pb-28">
        <div className="mx-auto max-w-[76rem]">
          <LiveBoard />

          {/* Was die Leute vor Ort schreiben, direkt neben dem Rundenstand. */}
          <div className="mt-20">
            <LiveFeed />
          </div>

          <p className="mt-10 max-w-xl text-xs leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            One note on the 2024 replay: the timing feed adds up to 502 loops, while the
            official Swiss total for that year is 501. We show the feed as it answers and
            keep 501 where the result is quoted.
          </p>
        </div>
      </section>
    </>
  );
}
