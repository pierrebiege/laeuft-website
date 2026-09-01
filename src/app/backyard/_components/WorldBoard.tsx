"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/app/backyard/_data/event";
import type { NationLive } from "@/app/backyard/_lib/raceresult";

type Year = "2026" | "2024";
type Payload = { year: string; nations: NationLive[]; failed: string[]; fetchedAt: string };

/**
 * Der Weltstand: alle Satelliten-Rennen in einer Tabelle.
 * Jede Nation timet für sich, niemand rechnet es während des Rennens
 * zusammen. Genau das passiert hier.
 */
export default function WorldBoard({ initialYear = "2026" }: { initialYear?: Year }) {
  const [year, setYear] = useState<Year>(initialYear);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Ohne res.ok und ohne catch endete eine 504 oder eine HTML-Antwort in
  // einer stillen Rejection: die Seite zeigte dann weder Fehler noch
  // Leerzustand, nur den Kopfbalken.
  const load = useCallback(async () => {
    setData(null);
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/world?year=${year}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Feed answered ${res.status}`);
      const json = (await res.json()) as Payload & { error?: string };
      if (json.error) throw new Error(json.error);
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    // Daten holen, sobald die Komponente steht oder das Jahr wechselt. Der
    // Server kann das nicht vorbereiten, die Anzeige hängt am Zeitmesssystem.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const lead = data?.nations[0]?.laps ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 rule">
        <span className="stamp">
          {loading ? "Checking the feeds" : `${data?.nations.length ?? 0} nations reporting`}
        </span>
        <div className="flex gap-px">
          {(["2026", "2024"] as Year[]).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className="border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] rule"
              style={
                year === y
                  ? { background: "var(--byd-fg)", color: "var(--byd-bg)", borderColor: "var(--byd-fg)" }
                  : { color: "var(--byd-mute)" }
              }
            >
              {y === "2026" ? "2026" : "2024 replay"}
            </button>
          ))}
        </div>
      </div>

      {error && !loading && (
        <div className="border-b py-16 rule">
          <h2 className="display max-w-xl text-[1.8rem] sm:text-4xl">The feeds are not answering.</h2>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            {error}. This page keeps trying every minute.
          </p>
        </div>
      )}

      {!error && data && data.nations.length === 0 && !loading && (
        <div className="border-b py-16 rule">
          <h2 className="display max-w-xl text-[1.8rem] sm:text-4xl">No nation online yet.</h2>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            The individual timing feeds for 2026 are not published yet. Every nation whose
            event number is on file shows up here on its own. The 2024 replay shows what
            this looks like on race day.
          </p>
          <button
            onClick={() => setYear("2024")}
            className="mt-8 border px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: "var(--byd-accent)", color: "#fff", borderColor: "var(--byd-accent)" }}
          >
            Run the 2024 replay
          </button>
        </div>
      )}

      <div>
        {data?.nations.map((n, i) => (
          <div key={n.slug} className="relative border-b py-6 rule">
            <div
              className="absolute inset-y-0 left-0 transition-[width] duration-700"
              style={{ width: lead ? `${(n.laps / lead) * 100}%` : "0%", background: "var(--bar)" }}
            />
            <div className="relative flex items-center gap-5">
              <span className="w-8 shrink-0 font-mono text-xs tnum" style={{ color: "var(--byd-mute)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold uppercase tracking-tight">{n.nation}</p>
                <p className="stamp mt-1 truncate">
                  {n.standing > 0 && !n.over ? `${n.standing} still running · ` : ""}
                  Loop {n.currentLap} · {n.runners.length} runners
                </p>
              </div>
              <div className="text-right">
                <p className="display tnum text-[2rem] leading-none sm:text-[2.6rem]">
                  {n.laps.toLocaleString("en-GB")}
                </p>
                <p className="stamp mt-1">Loops</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data && data.failed.length > 0 && (
        <p className="mt-5 text-xs" style={{ color: "var(--byd-mute)" }}>
          No data from: {data.failed.join(", ")}
        </p>
      )}
    </div>
  );
}
