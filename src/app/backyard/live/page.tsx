import type { Metadata } from "next";
import LiveBoard from "@/app/backyard/_components/LiveBoard";
import PageHead from "@/app/backyard/_components/PageHead";

export const metadata: Metadata = {
  title: "Live",
  description: "Der Rundenstand von Team Schweiz in Echtzeit, direkt aus der Zeitmessung in Baar.",
};

export default function LivePage() {
  return (
    <>
      <PageHead
        hour="nacht"
        stamp="Live · Baar ZG · Sa 17.10.2026, 14:00"
        title="Jede Runde, sobald sie fällt."
        lead="Der Stand kommt direkt aus der Zeitmessung und aktualisiert sich alle dreissig Sekunden. Solange das Rennen 2026 nicht läuft, kannst du dasselbe Board mit den echten Daten der Team-WM 2024 durchspielen."
      />
      <section data-hour="nacht" data-stamp="Live" className="px-5 pb-28">
        <div className="mx-auto max-w-[76rem]">
          <LiveBoard />
        </div>
      </section>
    </>
  );
}
