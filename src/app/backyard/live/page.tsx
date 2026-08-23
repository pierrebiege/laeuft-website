import type { Metadata } from "next";
import LiveBoard from "@/app/backyard/_components/LiveBoard";
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
        stamp="Live · Baar ZG · Sat 17.10.2026, 14:00"
        title="Live scoring"
        lead="Loop counts come straight from the timing system and refresh every thirty seconds. Until the 2026 race starts you can run the same board on the real data from the 2024 team championship."
      />
      <section data-hour="nacht" data-stamp="Live" className="px-5 pb-28">
        <div className="mx-auto max-w-[76rem]">
          <LiveBoard />
        </div>
      </section>
    </>
  );
}
