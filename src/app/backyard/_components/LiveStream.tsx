"use client";

import { useEffect, useState } from "react";
import { STREAM_API } from "@/app/backyard/_data/event";
import { youtubeWatch } from "@/app/backyard/_lib/stream";

/**
 * Der Livestream, eingebettet. Der Link kommt nicht aus dem Code, sondern
 * aus /api/backyard/stream und wird alle 30 Sekunden nachgefragt: ändert die
 * Regie ihn (neuer Stream nach einem Abbruch), wechselt das Bild ohne Neuladen.
 * Ohne Link zeigt die Komponente nichts.
 */
export default function LiveStream({ className = "" }: { className?: string }) {
  const [embed, setEmbed] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(STREAM_API, { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { embed: string | null };
        if (alive) setEmbed(json.embed);
      } catch {
        /* Netz weg: das alte Bild bleibt stehen. */
      }
    };
    load();
    const id = setInterval(load, 30_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  if (!embed) return null;

  return (
    <div id="stream" className={className}>
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b pb-3 rule">
        <span className="stamp">Livestream</span>
        <a href={youtubeWatch(embed)} target="_blank" rel="noopener noreferrer" className="stamp underline underline-offset-4">
          Open on YouTube
        </a>
      </div>
      <div className="relative aspect-video w-full overflow-hidden border rule" style={{ background: "#000" }}>
        <iframe
          key={embed}
          src={embed}
          title="Livestream Team Switzerland"
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
