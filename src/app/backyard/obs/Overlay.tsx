"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/app/backyard/_data/event";

type Live = { standing: number; currentLap: number; over: boolean };

const START = new Date(EVENT.startISO).getTime();
const HOUR = 3_600_000;

function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/**
 * Drei Zahlen, gross genug fürs Handy: Runde, Läufer im Rennen, Zeit bis zur
 * nächsten Glocke. Die Runde kommt aus der Uhr (Start 14:00, jede volle
 * Stunde eine neue), die Läufer aus dem Zeitnahme-Feed.
 */
export default function Overlay() {
  const [now, setNow] = useState<number | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!params) return;
    const year = params.get("year") === "2024" ? "2024" : "2026";
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/backyard/live?year=${year}&nation=ch`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (!stop && typeof d.standing === "number") setLive({ standing: d.standing, currentLap: d.currentLap, over: d.over });
      } catch {
        /* Feed weg: die letzte Zahl bleibt stehen */
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [params]);

  if (now === null || !params) return null;

  const test = params.get("year") === "2024";
  const manualLap = Number(params.get("lap")) || null;
  const manualLeft = params.has("left") ? Number(params.get("left")) : null;
  const before = !test && !manualLap && now < START;
  const elapsed = now - START;
  const clockLap = Math.floor(elapsed / HOUR) + 1;
  const toBell = HOUR - (((elapsed % HOUR) + HOUR) % HOUR);

  const lap = manualLap ?? (test ? live?.currentLap ?? null : clockLap);
  const left = manualLeft ?? live?.standing ?? null;
  const over = !manualLeft && live?.over && !before;
  const right = params.get("pos") === "right";

  const cell = "flex flex-col justify-between px-9 py-7";
  const label = "text-[22px] font-semibold uppercase tracking-[0.08em] text-white/70";
  const big = "mt-2 text-[104px] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums text-white";

  return (
    <div
      className="fixed bottom-[56px] flex flex-col"
      style={{ [right ? "right" : "left"]: 56, fontFamily: "var(--font-archivo), system-ui, sans-serif" }}
    >
      <div className="flex items-center gap-3 self-start px-5 py-3" style={{ background: "#d8000e" }}>
        <span className="relative grid h-[22px] w-[22px] place-items-center bg-white">
          <span className="absolute h-[14px] w-[4px]" style={{ background: "#d8000e" }} />
          <span className="absolute h-[4px] w-[14px]" style={{ background: "#d8000e" }} />
        </span>
        <span className="text-[22px] font-extrabold uppercase tracking-[0.04em] text-white">Team Switzerland · Baar</span>
      </div>

      <div className="flex divide-x divide-white/20" style={{ background: "rgba(11,11,11,0.88)" }}>
        {before ? (
          <div className={cell}>
            <span className={label}>Start in</span>
            <span className={big}>{mmss(START - now)}</span>
          </div>
        ) : (
          <>
            <div className={cell}>
              <span className={label}>Loop</span>
              <span className={big}>{lap ?? "–"}</span>
            </div>
            {left !== null && (
              <div className={cell}>
                <span className={label}>Still running</span>
                <span className={big}>
                  {left}
                  <span className="text-[52px] text-white/50"> / {EVENT.teamSize}</span>
                </span>
              </div>
            )}
            {!over && !test && (
              <div className={cell}>
                <span className={label}>Next bell</span>
                <span className={big}>{mmss(toBell)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
