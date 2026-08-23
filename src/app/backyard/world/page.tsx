import type { Metadata } from "next";
import WorldBoard from "@/app/backyard/_components/WorldBoard";
import PageHead from "@/app/backyard/_components/PageHead";

export const metadata: Metadata = {
  title: "World standings",
  description: "Every satellite race of the Backyard Ultra Team World Championship in one table.",
};

export default function WorldPage() {
  return (
    <>
      <PageHead
        hour="tief"
        stamp="World standings · over 50 nations · same start"
        title="World standings"
        lead="Every nation runs its own race and times it itself. The totals are normally only added up afterwards. This page pulls the public timing feeds together while the race is on."
      />
      <section data-hour="tief" data-stamp="World standings" className="px-5 pb-28">
        <div className="mx-auto max-w-[76rem]">
          <WorldBoard />
          <p className="mt-16 max-w-xl text-sm leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            Not every nation publishes its data. A missing country is not a statement.
            As soon as an event number is known, it shows up here on its own.
          </p>
        </div>
      </section>
    </>
  );
}
