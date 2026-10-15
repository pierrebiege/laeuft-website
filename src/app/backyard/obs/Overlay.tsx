"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT, TEAM } from "@/app/backyard/_data/event";

/**
 * Zwei Ebenen für OBS, die von selbst die Ansicht wechseln. Niemand klickt.
 * /obs = Leiste (part "bar"), /obs/plus = Namen und Ausgeschieden (part "plus").
 * Spinnt /obs/plus, blendet man sie in OBS aus; die Leiste läuft weiter.
 * Drei Teile, jeder in seiner Ecke, nichts überdeckt sich:
 *
 *  - unten links, immer: Runde, im Rennen, nächste Glocke
 *  - oben rechts, 4 min vor bis 1 min nach jeder Glocke: alle Namen
 *  - oben links, 15 s: wer gerade ausgeschieden ist
 *
 * Ausgeschieden ist nur, wen die Zeitnahme als DNF führt. Wir raten nie
 * aus Rundenzahlen, solange der Feed einen Status mitliefert – wer um
 * 59:50 ins Ziel kommt, ist drin, bis der Zeitnehmer etwas anderes sagt.
 *
 * Parameter: ?demo=1 Zeitraffer (1 Runde = 40 s), ?year=2024 Schlussliste
 * 2024, ?show=before|race|list|out|final eine Ansicht fest (für Vorschauen).
 */

type Row = { key: string; name: string; laps: number | null; out: boolean };
type Feed = { rows: Row[]; over: boolean };
type FeedRunner = { first: string; last: string; laps: number; status: "in" | "out" | "winner" | null };

const CALL: Record<string, string> = { Gervaix: "François", Desteffani: "Jogi" };
const nameOf = (first: string, last: string) => `${CALL[last] ?? first} ${last}`;
const TEAM_ROWS: Row[] = TEAM.map((a) => ({ key: a.name, name: nameOf(a.first, a.name), laps: null, out: false }));
const KM = 6.706;
const BANNER_MS = 15_000;

const RED = "#d8000e";
const INK = "rgba(11,11,11,0.88)";

function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/** Jeder scheidet bei seiner Quali-Rundenzahl aus. Für Demo und Vorschauen. */
function fakeFeed(lap: number, over = false): Feed {
  return {
    over,
    rows: TEAM.map((a) => {
      const out = lap > a.qual + 1;
      return { key: a.name, name: nameOf(a.first, a.name), laps: out ? a.qual : lap - 1, out };
    }),
  };
}

export default function Overlay({ part }: { part: "bar" | "plus" }) {
  const [now, setNow] = useState<number | null>(null);
  const [params, setParams] = useState<URLSearchParams | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [banner, setBanner] = useState<Row[] | null>(null);
  const [temp, setTemp] = useState<number | null>(null);
  const [t0, setT0] = useState(0);
  const prevOut = useRef<Set<string> | null>(null);
  const queue = useRef<Row[][]>([]);

  const show = params?.get("show") ?? null;
  const demo = params?.get("demo") === "1";
  const test = params?.get("year") === "2024";
  const HOUR = demo ? 40_000 : 3_600_000;
  const START = demo ? t0 - 28.5 * HOUR : new Date(EVENT.startISO).getTime();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setT0(Date.now());
    setParams(new URLSearchParams(window.location.search));
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const elapsed = (now ?? 0) - START;
  const lap = Math.floor(elapsed / HOUR) + 1;
  const inLap = ((elapsed % HOUR) + HOUR) % HOUR;

  // Zeitnahme alle 20 s
  useEffect(() => {
    if (!params || demo || show) return;
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/backyard/live?year=${test ? "2024" : "2026"}&nation=ch`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (stop || !Array.isArray(d.runners) || !d.runners.length) return;
        const list = d.runners as FeedRunner[];
        const hasStatus = list.some((x) => x.status);
        const best = Math.max(...list.map((x) => x.laps));
        // Ohne Status (alte Listen) nur für die fertige Schlussliste raten
        const isOut = (x: FeedRunner) => (hasStatus ? x.status === "out" : d.over ? x.laps < best : false);
        setFeed({
          over: Boolean(d.over),
          rows: list.map((x) => ({ key: x.last, name: nameOf(x.first, x.last), laps: x.laps, out: isOut(x) })),
        });
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
  }, [params, demo, test, show]);

  // Temperatur in Baar alle 10 min (Open-Meteo, ohne Schlüssel). Fehlt sie, fällt das Feld weg.
  useEffect(() => {
    if (!params || show) return;
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=47.195&longitude=8.526&current=temperature_2m");
        const d = await r.json();
        const t = d?.current?.temperature_2m;
        if (!stop && typeof t === "number") setTemp(Math.round(t));
      } catch {
        /* ohne Temperatur */
      }
    };
    load();
    const t = setInterval(load, 600_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [params, show]);

  // Demo: Feed aus der Uhr
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (demo) setFeed(fakeFeed(lap));
  }, [demo, lap]);

  // Neu ausgeschieden → eine Einblendung für alle, die im selben Moment rausfallen.
  // Beim ersten Laden nichts zeigen, sonst kämen alle alten auf einmal.
  useEffect(() => {
    if (!feed) return;
    const fresh = prevOut.current ? feed.rows.filter((r) => r.out && !prevOut.current!.has(r.key)) : [];
    if (fresh.length) queue.current.push(fresh);
    prevOut.current = new Set(feed.rows.filter((r) => r.out).map((r) => r.key));
  }, [feed]);

  useEffect(() => {
    if (banner || !queue.current.length) return;
    setBanner(queue.current.shift()!);
  }, [banner, now]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), demo ? 6000 : BANNER_MS);
    return () => clearTimeout(t);
  }, [banner, demo]);

  if (now === null || !params) return null;

  // Vorschau einer festen Ansicht
  let v = {
    before: !demo && !test && now < START,
    lap: test ? Math.max(0, ...(feed?.rows ?? []).map((r) => r.laps ?? 0)) : lap,
    toBell: HOUR - inLap,
    rows: feed?.rows ?? TEAM_ROWS,
    over: Boolean(feed?.over) && !(now < START && !test),
    list: false,
    banner,
  };
  const corral = demo ? HOUR - inLap < HOUR * 0.35 : HOUR - inLap < 4 * 60_000 || inLap < 60_000;
  v.list = v.before || v.over || test || corral;
  if (show) {
    const f = fakeFeed(32, show === "final");
    const base = { before: false, lap: 32, toBell: 23 * 60_000 + 14_000, rows: f.rows, over: false, list: false, banner: null as Row[] | null };
    if (show === "before") v = { ...base, before: true, toBell: 0, rows: TEAM_ROWS, list: true };
    if (show === "race") v = base;
    if (show === "list") v = { ...base, toBell: 2 * 60_000 + 41_000, list: true };
    if (show === "out") v = { ...base, toBell: 59 * 60_000 + 48_000, banner: f.rows.filter((r) => r.out && r.laps === 30) };
    if (show === "final") {
      const rows = TEAM.map((a, i) => ({ key: a.name, name: nameOf(a.first, a.name), laps: i === 0 ? 60 : a.qual, out: i !== 0 }));
      v = { ...base, lap: 60, rows, over: true, list: true };
    }
  }

  // Laufzeit seit dem Start, auch im Zeitraffer in echten Stunden
  const raceTime = Math.max(0, (v.lap - 1 + (1 - v.toBell / HOUR)) * 3_600_000);
  const tempShown = show ? 11 : temp;
  const left = params.has("left") ? Number(params.get("left")) : v.rows.filter((r) => !r.out).length;
  const last = v.rows.find((r) => !r.out);
  const startAt = show === "before" ? 25 * 60_000 + 30_000 : START - now;


  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: "var(--font-archivo), system-ui, sans-serif" }}>
      {/* Unten links: Leiste */}
      {part === "bar" && (
      <div className="absolute bottom-[56px] left-[56px] flex flex-col">
        <Tag>Team Switzerland · Baar</Tag>
        <div className="flex divide-x divide-white/20" style={{ background: INK }}>
          {v.before ? (
            <>
              <Cell k="Start in" v={clock(startAt)} />
              <Cell k="Baar" v={tempShown === null ? "–" : `${tempShown}°`} />
            </>
          ) : v.over && last ? (
            <>
              <Cell k="Last one standing" v={last.name} />
              <Cell k="Loops" v={String(last.laps)} />
              <Cell k="Distance" v={km(last.laps ?? 0)} unit="km" />
            </>
          ) : (
            <>
              <Cell k="Loop" v={String(v.lap)} />
              <Cell k="Distance" v={km(v.lap)} unit="km" />
              <Cell k="Race time" v={clock(raceTime)} />
              {!test && <Cell k="Next bell" v={clock(v.toBell)} accent />}
              <Cell k="Still running" v={String(left)} unit={`/ ${EVENT.teamSize}`} />
              {tempShown !== null && <Cell k="Baar" v={`${tempShown}°`} />}
            </>
          )}
        </div>
      </div>
      )}

      {/* Oben rechts: alle Namen */}
      {part === "plus" && (
      <div
        className="absolute right-[56px] top-[56px] w-[460px] transition-[opacity,transform] duration-700"
        style={{ opacity: v.list ? 1 : 0, transform: v.list ? "none" : "translateX(40px)" }}
      >
        <Tag>{v.before ? "The Swiss team" : v.over ? "Final" : "Swiss team"}</Tag>
        <ol style={{ background: INK }} className="py-2">
          {[...v.rows]
            .sort((a, b) => Number(a.out) - Number(b.out) || (b.laps ?? 0) - (a.laps ?? 0))
            .map((r) => (
              <li key={r.key} className="flex items-baseline justify-between px-6 py-[7px] text-[24px] font-semibold">
                <span className={r.out ? "text-white/35 line-through decoration-2" : "text-white"}>{r.name}</span>
                <span className={`tabular-nums ${r.out ? "text-white/35" : "text-white/60"}`}>
                  {r.out || v.over ? r.laps : v.before ? "" : "in"}
                </span>
              </li>
            ))}
        </ol>
      </div>
      )}

      {/* Oben links: ausgeschieden */}
      {part === "plus" && v.banner && v.banner.length > 0 && (
        <div key={v.banner.map((r) => r.key).join()} className="absolute left-[56px] top-[56px] flex flex-col" style={{ animation: "byd-in .5s ease-out" }}>
          <Tag>Out</Tag>
          <div className="px-9 py-6" style={{ background: INK }}>
            {v.banner.slice(0, 4).map((r) => (
              <div key={r.key} className="py-1">
                <div className="text-[52px] font-extrabold leading-none tracking-[-0.02em] text-white">{r.name}</div>
                <div className="mt-2 text-[22px] font-semibold uppercase tracking-[0.06em] text-white/70">
                  {r.laps} loops · {((r.laps ?? 0) * KM).toFixed(1)} km
                </div>
              </div>
            ))}
            {v.banner.length > 4 && (
              <div className="mt-2 text-[22px] font-semibold uppercase tracking-[0.06em] text-white/70">
                + {v.banner.length - 4} more
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes byd-in{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

const km = (laps: number) => (laps * KM).toFixed(1);

/** Ein Feld der Leiste: kleines Etikett, grosse Zahl. */
function Cell({ k, v, unit, accent }: { k: string; v: string; unit?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col justify-between px-8 py-5">
      <span className="text-[18px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent ? "#ff4d55" : "rgba(255,255,255,0.7)" }}>
        {k}
      </span>
      <span className="mt-2 whitespace-nowrap text-[64px] font-extrabold leading-[0.9] tracking-[-0.02em] tabular-nums text-white">
        {v}
        {unit && <span className="ml-2 text-[30px] text-white/50">{unit}</span>}
      </span>
    </div>
  );
}

/** Roter Kopf mit Kreuz, gleich für alle drei Teile. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 self-start px-5 py-3" style={{ background: RED }}>
      <span className="relative grid h-[22px] w-[22px] place-items-center bg-white">
        <span className="absolute h-[14px] w-[4px]" style={{ background: RED }} />
        <span className="absolute h-[4px] w-[14px]" style={{ background: RED }} />
      </span>
      <span className="text-[22px] font-extrabold uppercase tracking-[0.04em] text-white">{children}</span>
    </div>
  );
}
