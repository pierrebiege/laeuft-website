"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT, TEAM } from "@/app/backyard/_data/event";

/**
 * Eine Ebene für OBS, die von selbst die Ansicht wechselt. Niemand klickt.
 *
 *  - immer: Leiste unten links (Runde, im Rennen, nächste Glocke)
 *  - in den letzten Minuten vor der Glocke und kurz danach: alle Namen
 *    rechts, wer raus ist, grau mit seiner Rundenzahl
 *  - scheidet jemand aus: grosse Einblendung mit Namen, ein paar Sekunden
 *  - vor dem Start: Countdown und das ganze Team
 *  - nach dem Rennen: der Letzte im Rennen
 *
 * Runde und Glocke kommen aus der Uhr (Start 14:00, jede volle Stunde),
 * wer drin ist aus der Zeitnahme. Ohne Feed gelten alle als im Rennen.
 *
 * Parameter: ?demo=1 spielt ein Rennen im Zeitraffer ab (1 Runde = 40 s),
 * ?year=2024 zeigt die Schlussliste von 2024, ?left=12 setzt die Zahl von Hand.
 */

type Row = { key: string; name: string; laps: number | null; out: boolean };
type Feed = { rows: Row[]; over: boolean };

const CALL: Record<string, string> = { Gervaix: "François", Desteffani: "Jogi" };
const nameOf = (first: string, last: string) => `${CALL[last] ?? first} ${last}`;
const TEAM_ROWS: Row[] = TEAM.map((a) => ({ key: a.name, name: nameOf(a.first, a.name), laps: null, out: false }));

const font = { fontFamily: "var(--font-archivo), system-ui, sans-serif" };
const RED = "#d8000e";
const INK = "rgba(11,11,11,0.88)";

function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/** Zeitraffer: Start liegt 27,5 Runden zurück, jeder fällt bei seiner Quali-Rundenzahl raus. */
function demoFeed(lap: number): Feed {
  return {
    over: false,
    rows: TEAM.map((a) => {
      const out = lap > a.qual;
      return { key: a.name, name: nameOf(a.first, a.name), laps: out ? a.qual : lap - 1, out };
    }),
  };
}

export default function Overlay() {
  const [now, setNow] = useState<number | null>(null);
  const [params, setParams] = useState<URLSearchParams | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [banner, setBanner] = useState<Row | null>(null);
  const t0 = useRef(0);
  const prevOut = useRef<Set<string> | null>(null);
  const queue = useRef<Row[]>([]);

  const demo = params?.get("demo") === "1";
  const test = params?.get("year") === "2024";
  const HOUR = demo ? 40_000 : 3_600_000;
  const START = demo ? t0.current - 27.5 * HOUR : new Date(EVENT.startISO).getTime();

  useEffect(() => {
    t0.current = Date.now();
    setParams(new URLSearchParams(window.location.search));
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Zeitnahme alle 20 s
  useEffect(() => {
    if (!params || demo) return;
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/backyard/live?year=${test ? "2024" : "2026"}&nation=ch`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (stop || !Array.isArray(d.runners)) return;
        const cur: number = d.currentLap ?? 0;
        const hasStatus = d.runners.some((x: { status: string | null }) => x.status);
        const rows: Row[] = d.runners.map((x: { first: string; last: string; laps: number; status: string | null }) => ({
          key: x.last,
          name: nameOf(x.first, x.last),
          laps: x.laps,
          out: hasStatus ? x.status === "out" : x.laps < cur,
        }));
        setFeed({ rows, over: Boolean(d.over) });
      } catch {
        /* Feed weg: das Letzte bleibt stehen */
      }
    };
    load();
    const t = setInterval(load, 20_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [params, demo, test]);

  // Demo: Feed aus der Uhr
  const elapsed = (now ?? 0) - START;
  const lap = Math.floor(elapsed / HOUR) + 1;
  useEffect(() => {
    if (demo && now) setFeed(demoFeed(lap));
  }, [demo, lap, now]);

  // Neu ausgeschieden → Einblendung. Beim ersten Laden nichts zeigen.
  useEffect(() => {
    if (!feed) return;
    const out = new Set(feed.rows.filter((r) => r.out).map((r) => r.key));
    if (prevOut.current) {
      for (const r of feed.rows) if (r.out && !prevOut.current.has(r.key)) queue.current.push(r);
    }
    prevOut.current = out;
  }, [feed]);

  useEffect(() => {
    if (banner || !queue.current.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBanner(queue.current.shift()!);
  }, [banner, now]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), demo ? 5000 : 15000);
    return () => clearTimeout(t);
  }, [banner, demo]);

  if (now === null || !params) return null;

  const before = !demo && !test && now < START;
  const toBell = HOUR - (((elapsed % HOUR) + HOUR) % HOUR);
  const inLap = HOUR - toBell;
  const rows = feed?.rows ?? TEAM_ROWS;
  const manualLeft = params.has("left") ? Number(params.get("left")) : null;
  const left = manualLeft ?? rows.filter((r) => !r.out).length;
  const over = Boolean(feed?.over) && !before;
  const shownLap = test ? Math.max(0, ...rows.map((r) => r.laps ?? 0)) : lap;

  // Liste: vor dem Start immer, sonst 4 min vor bis 1 min nach der Glocke
  const corral = demo ? toBell < HOUR * 0.35 : toBell < HOUR * (4 / 60) || inLap < HOUR * (1 / 60);
  const showList = before || over || test || corral;
  const last = rows.find((r) => !r.out);

  const label = "text-[22px] font-semibold uppercase tracking-[0.08em] text-white/70";
  const big = "mt-2 text-[104px] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums text-white";
  const cell = "flex flex-col justify-between px-9 py-7";

  return (
    <div className="fixed inset-0 overflow-hidden" style={font}>
      {/* Leiste */}
      <div className="absolute bottom-[56px] left-[56px] flex flex-col">
        <div className="flex items-center gap-3 self-start px-5 py-3" style={{ background: RED }}>
          <Cross />
          <span className="text-[22px] font-extrabold uppercase tracking-[0.04em] text-white">Team Switzerland · Baar</span>
        </div>
        <div className="flex divide-x divide-white/20" style={{ background: INK }}>
          {before ? (
            <div className={cell}>
              <span className={label}>Start in</span>
              <span className={big}>{clock(START - now)}</span>
            </div>
          ) : over && last ? (
            <div className={cell}>
              <span className={label}>Last one standing · {shownLap} loops</span>
              <span className={big}>{last.name}</span>
            </div>
          ) : (
            <>
              <div className={cell}>
                <span className={label}>Loop</span>
                <span className={big}>{shownLap}</span>
              </div>
              <div className={cell}>
                <span className={label}>Still running</span>
                <span className={big}>
                  {left}
                  <span className="text-[52px] text-white/50"> / {EVENT.teamSize}</span>
                </span>
              </div>
              {!test && (
                <div className={cell}>
                  <span className={label}>Next bell</span>
                  <span className={big}>{clock(toBell)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Namen */}
      <div
        className="absolute right-[56px] top-[56px] w-[460px] transition-all duration-700"
        style={{ opacity: showList ? 1 : 0, transform: showList ? "none" : "translateX(40px)" }}
      >
        <div className="px-6 py-3 text-[20px] font-extrabold uppercase tracking-[0.06em] text-white" style={{ background: RED }}>
          {before ? "The Swiss team" : over ? "Final" : `Loop ${shownLap + (inLap < HOUR / 60 ? 0 : 1)} · who starts`}
        </div>
        <ol style={{ background: INK }} className="py-2">
          {[...rows]
            .sort((a, b) => Number(a.out) - Number(b.out) || (b.laps ?? 0) - (a.laps ?? 0))
            .map((r) => (
              <li key={r.key} className="flex items-baseline justify-between px-6 py-[7px] text-[24px] font-semibold">
                <span className={r.out ? "text-white/35 line-through decoration-2" : "text-white"}>{r.name}</span>
                <span className={`tabular-nums ${r.out ? "text-white/35" : "text-white/60"}`}>
                  {r.out ? r.laps : before ? "" : "in"}
                </span>
              </li>
            ))}
        </ol>
      </div>

      {/* Ausgeschieden */}
      {banner && (
        <div className="absolute left-1/2 top-[64px] -translate-x-1/2 animate-[byd-drop_.5s_ease-out]">
          <div className="flex items-stretch">
            <div className="flex items-center px-7 text-[26px] font-extrabold uppercase tracking-[0.06em] text-white" style={{ background: RED }}>
              Out
            </div>
            <div className="px-9 py-5" style={{ background: INK }}>
              <div className="text-[56px] font-extrabold leading-none tracking-[-0.02em] text-white">{banner.name}</div>
              <div className="mt-2 text-[24px] font-semibold uppercase tracking-[0.06em] text-white/70">
                {banner.laps} loops · {((banner.laps ?? 0) * 6.706).toFixed(1)} km
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes byd-drop{from{opacity:0;transform:translate(-50%,-24px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}

function Cross() {
  return (
    <span className="relative grid h-[22px] w-[22px] place-items-center bg-white">
      <span className="absolute h-[14px] w-[4px]" style={{ background: RED }} />
      <span className="absolute h-[4px] w-[14px]" style={{ background: RED }} />
    </span>
  );
}
