import type { Metadata } from "next";
import WorldBoard from "@/app/backyard/_components/WorldBoard";
import PageHead from "@/app/backyard/_components/PageHead";

export const metadata: Metadata = {
  title: "Weltstand",
  description: "Alle Satelliten-Rennen der Backyard Ultra Team-WM in einer Tabelle.",
};

export default function WorldPage() {
  return (
    <>
      <PageHead
        hour="tief"
        stamp="Weltstand · über 50 Nationen · gleicher Startschuss"
        title="Der Weltstand, während er entsteht."
        lead="Jede Nation läuft ihr eigenes Rennen und timet es selbst. Zusammengezählt wird sonst erst hinterher. Hier laufen die öffentlichen Zeitmessungen der Länder zusammen, während gelaufen wird."
      />
      <section data-hour="tief" data-stamp="Weltstand" className="px-5 pb-28">
        <div className="mx-auto max-w-[76rem]">
          <WorldBoard />
          <p className="mt-16 max-w-xl text-sm leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            Nicht jede Nation stellt ihre Daten öffentlich. Wer fehlt, fehlt nicht aus
            Absicht – sobald eine Event-Nummer bekannt ist, erscheint das Land hier
            automatisch mit.
          </p>
        </div>
      </section>
    </>
  );
}
