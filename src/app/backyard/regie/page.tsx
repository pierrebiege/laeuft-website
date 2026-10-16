import type { Metadata } from "next";
import StreamForm from "@/app/backyard/_components/StreamForm";

export const metadata: Metadata = {
  title: "Regie",
  robots: { index: false, follow: false },
};

/**
 * Regie fürs Rennwochenende: hier wird der YouTube-Link des Livestreams
 * gewechselt. Aufruf mit /regie?k=<BACKYARD_STREAM_KEY>; der Schlüssel wird
 * im Browser behalten. Gespeichert wird erst nach Prüfung auf dem Server.
 */
export default function RegiePage() {
  return (
    <section data-hour="tag" className="px-5 pb-28 pt-28">
      <div className="mx-auto max-w-[44rem]">
        <StreamForm />
      </div>
    </section>
  );
}
