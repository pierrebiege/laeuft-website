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
        stamp="World standings · every nation with a public feed"
        title="World standings"
        lead="Every nation runs its own race at home and times it itself, all starting at the same second. The totals are normally only added up afterwards. This page adds up the ones that are readable while the race is still on."
      />
      <section data-hour="tief" data-stamp="World standings" className="px-5 pb-28">
        <div className="mx-auto max-w-[76rem]">
          <WorldBoard />
          <p className="mt-16 max-w-xl text-sm leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            Not every nation publishes its data, and this is a much shorter list than
            the field. A missing country is not a statement — as soon as its event
            number is known, it shows up here on its own.
          </p>
        </div>
      </section>
    </>
  );
}
