import type { Metadata } from "next";
import PostGenerator from "@/app/backyard/_components/PostGenerator";

export const metadata: Metadata = {
  title: "Post-Generator",
  robots: { index: false, follow: false },
};

/** Nicht verlinkt. Für wen den Instagram-Kanal am Rennwochenende führt. */
export default function GeneratorPage() {
  return (
    <section data-hour="tag" data-stamp="Generator" className="px-5 pb-24 pt-28">
      <div className="mx-auto max-w-[72rem]">
        <p className="stamp mb-6">Instagram</p>
        <h1 className="display text-[2rem] sm:text-4xl">Post-Generator.</h1>
        <p className="mt-4 max-w-[40rem] text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Vorlage wählen, Foto dazu, JPG speichern. Die Zahlen kommen während des Rennens
          automatisch von der Zeitmessung und lassen sich jederzeit von Hand ändern.
          Fotos vom Handy bleiben auf dem Handy.
        </p>
        <PostGenerator />
      </div>
    </section>
  );
}
