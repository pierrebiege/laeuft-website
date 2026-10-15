"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT, PHOTO_BASE, TEAM } from "@/app/backyard/_data/event";
import { PROFILES } from "@/app/backyard/_data/people";

/**
 * Zwei Ebenen für OBS, die von selbst die Ansicht wechseln. Niemand klickt.
 * /obs = Leiste (part "bar"), /obs/plus = Namen und Ausgeschieden (part "plus").
 * Spinnt /obs/plus, blendet man sie in OBS aus; die Leiste läuft weiter.
 * Drei Teile, jeder in seiner Ecke, nichts überdeckt sich:
 *
 *  - unten links, immer: Runde, im Rennen, nächste Glocke
 *  - oben rechts, 4 min vor bis 1 min nach jeder Glocke: alle Namen;
 *    vor dem Start alle 20 s eine Läuferkarte, im Rennen 2–4 pro Stunde
 *    (je weniger im Rennen, desto öfter), reihum unter denen, die noch laufen
 *  - oben links, 30 s: wer gerade ausgeschieden ist; sonst um :02 ein
 *    Meilenstein (100 km, 24 h …)
 *  - rechts über der Leiste, 12 s: Grüsse aus dem Feed der Website, frühestens
 *    3 min nach dem Absenden (Zeit zum Löschen), höchstens einer pro Minute
 *
 * Ausgeschieden ist nur, wen die Zeitnahme als DNF führt. Wir raten nie
 * aus Rundenzahlen, solange der Feed einen Status mitliefert – wer um
 * 59:50 ins Ziel kommt, ist drin, bis der Zeitnehmer etwas anderes sagt.
 *
 * Parameter: ?demo=1 Zeitraffer (1 Runde = 40 s), ?year=2024 Schlussliste
 * 2024, ?show=before|race|list|card|out|milestone|cheer|final eine Ansicht fest.
 */

type Row = { key: string; name: string; laps: number | null; out: boolean };
type Feed = { rows: Row[]; over: boolean };
type FeedRunner = { first: string; last: string; laps: number; status: "in" | "out" | "winner" | null };

const CALL: Record<string, string> = { Gervaix: "François", Desteffani: "Jogi" };
const nameOf = (first: string, last: string) => `${CALL[last] ?? first} ${last}`;
const TEAM_ROWS: Row[] = TEAM.map((a) => ({ key: a.name, name: nameOf(a.first, a.name), laps: null, out: false }));
const KM = 6.706;
/** Teamrunden der Schweiz 2024, offizielle Wertung Big's. */
const TEAM_2024 = 501;
const BANNER_MS = 30_000;
const CHEER_MS = 12_000;
const CHEER_GAP = 60_000;
const CHEER_DELAY = 3 * 60_000;
/** Nach so vielen Runden eine Einblendung. */
const MILESTONES: Record<number, string> = {
  10: "10 loops · 67 km",
  15: "15 loops · 100 km",
  24: "24 hours · 100 miles",
  30: "30 loops · 201 km",
  36: "36 hours",
  48: "48 hours",
};

type Cheer = { id: string; author: string; body: string; at: number };

/**
 * Wie oft eine Karte kommt. Bei 15 Läufern 4 pro Stunde (jede Person etwa
 * alle 4 h), bei 2–3 drei, am Schluss zwei. Durchgezählt wird über das ganze
 * Rennen, so kommt reihum jede Person dran, ohne dass etwas gespeichert wird.
 */
const cardsPerHour = (n: number) => (n >= 4 ? 4 : n >= 2 ? 3 : 2);
const slotsFor = (k: number) => Array.from({ length: k }, (_, i) => 6 + i * (44 / k));

/** Spitznamen, die in Grüssen vorkommen. Schlüssel klein geschrieben. */
const NICK: Record<string, string> = { isi: "Röthlisberger", jogi: "Desteffani", joerg: "Desteffani", jörg: "Desteffani", nico: "Lehmann", dani: "Schwitter", sebi: "Kopp", seb: "Kopp", francois: "Gervaix" };

/** Für wen ist der Gruss? Vorname, Rufname oder Spitzname als ganzes Wort. */
function addressee(body: string): string | null {
  const words = body.toLowerCase().normalize("NFC").split(/[^\p{L}]+/u);
  for (const a of TEAM) {
    const keys = [a.first.toLowerCase(), (CALL[a.name] ?? "").toLowerCase(), ...Object.keys(NICK).filter((k) => NICK[k] === a.name)];
    if (keys.some((k) => k && words.includes(k))) return CALL[a.name] ?? a.first;
  }
  return null;
}
type Card = { key: string; name: string; photo: string; qual: number; lead: string };

const CARDS: Card[] = TEAM.filter((a) => a.photo).map((a) => {
  const p = PROFILES[a.photo!];
  return {
    key: a.name,
    name: nameOf(a.first, a.name),
    photo: `${PHOTO_BASE}/${a.photo}.jpg`,
    qual: a.qual,
    lead: p?.lead ?? "",
  };
});

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
  const [cheer, setCheer] = useState<Cheer | null>(null);
  const cheers = useRef<Cheer[]>([]);
  const seen = useRef<Set<string> | null>(null);
  const lastCheer = useRef(0);

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

  // Grüsse von der Website alle 30 s. Beim ersten Laden gilt alles älter
  // als 30 min als gesehen, sonst liefe eine Stunde Nachrichten nach.
  useEffect(() => {
    if (!params || demo || show || part !== "plus") return;
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch("/api/backyard/feed", { cache: "no-store" });
        const d = await r.json();
        if (stop || !Array.isArray(d.posts)) return;
        const posts: Cheer[] = d.posts
          .filter((x: { kind: string }) => x.kind === "cheer")
          .map((x: { id: string; author: string; body: string; created_at: string }) => ({
            id: x.id,
            author: x.author,
            body: x.body,
            at: new Date(x.created_at).getTime(),
          }));
        const live = new Set(posts.map((x) => x.id));
        // Gelöschte fliegen auch aus der Warteschlange
        cheers.current = cheers.current.filter((x) => live.has(x.id));
        if (!seen.current) seen.current = new Set(posts.filter((x) => Date.now() - x.at > 30 * 60_000).map((x) => x.id));
        for (const x of posts.sort((a, b) => a.at - b.at)) {
          if (seen.current.has(x.id)) continue;
          seen.current.add(x.id);
          cheers.current.push(x);
        }
      } catch {
        /* ohne Grüsse */
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [params, demo, show, part]);

  useEffect(() => {
    if (cheer || !now || now - lastCheer.current < CHEER_GAP) return;
    // Um die Glocke steht rechts die Namensliste: dann wartet der Gruss
    const il = (((now - START) % HOUR) + HOUR) % HOUR;
    if (now >= START && (HOUR - il < 4.5 * 60_000 || il < 1.5 * 60_000)) return;
    const i = cheers.current.findIndex((x) => now - x.at >= CHEER_DELAY);
    if (i < 0) return;
    lastCheer.current = now;
    setCheer(cheers.current.splice(i, 1)[0]);
  }, [cheer, now, START, HOUR]);

  useEffect(() => {
    if (!cheer) return;
    const t = setTimeout(() => setCheer(null), CHEER_MS);
    return () => clearTimeout(t);
  }, [cheer]);

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
    card: null as Card | null,
    milestone: null as string | null,
    cheer: cheer as Cheer | null,
  };
  const corral = demo ? HOUR - inLap < HOUR * 0.35 : HOUR - inLap < 4 * 60_000 || inLap < 60_000;
  v.list = !v.before && (v.over || test || corral);
  // Läuferkarten: vor dem Start alle 20 s die nächste, im Rennen um :10, :25, :40
  const min = demo ? (inLap / HOUR) * 60 : inLap / 60_000;
  // Mehr Karten pro Stunde, je weniger noch laufen; gleichmässig zwischen :06 und :50
  const inRows = v.rows.filter((r) => !r.out).map((r) => r.key);
  const inCards = CARDS.filter((c) => inRows.includes(c.key) || !feed);
  const perHour = cardsPerHour(inCards.length);
  const slot = slotsFor(perHour).findIndex((m) => min >= m && min < m + (demo ? 6 : 1 / 3));
  if (v.before) v.card = CARDS[Math.floor(now / 20_000) % CARDS.length];
  else if (!v.over && !test && slot >= 0 && inCards.length) v.card = inCards[((lap - 1) * perHour + slot) % inCards.length];
  // Meilenstein zwei Minuten nach der Glocke, 30 s lang, wenn gerade kein Out läuft
  if (!v.before && !v.over && !test && min >= 2 && min < (demo ? 8 : 2.5)) v.milestone = MILESTONES[lap - 1] ?? null;
  if (show) {
    const f = fakeFeed(32, show === "final");
    const base = {
      before: false,
      lap: 32,
      toBell: 23 * 60_000 + 14_000,
      rows: f.rows,
      over: false,
      list: false,
      banner: null as Row[] | null,
      card: null as Card | null,
      milestone: null as string | null,
      cheer: null as Cheer | null,
    };
    if (show === "before") v = { ...base, before: true, toBell: 0, rows: TEAM_ROWS, card: CARDS[1] };
    if (show === "card") v = { ...base, toBell: 50 * 60_000, card: CARDS[4] };
    if (show === "milestone") v = { ...base, lap: 25, toBell: 57 * 60_000 + 40_000, milestone: MILESTONES[24] };
    if (show === "cheer")
      v = { ...base, toBell: 37 * 60_000 + 5_000, cheer: { id: "x", author: "Anna", body: "Hopp Isi! Jede Runde ein Fest, wir sind bei dir.", at: 0 } };
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
  // Teamrunden: aus der Zeitnahme, sonst fertige Runden mal Läufer im Rennen
  const teamLoops = feed && !show ? v.rows.reduce((t, r) => t + (r.laps ?? 0), 0) : Math.max(0, v.lap - 1) * left;
  const startAt = show === "before" ? 25 * 60_000 + 30_000 : START - now;


  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: "var(--font-archivo), system-ui, sans-serif" }}>
      {/* Unten links: Leiste */}
      {part === "bar" && (
      <div className="absolute bottom-[56px] left-[56px] flex flex-col">
        <Tag>Team Switzerland · Baar</Tag>
        <div className="flex divide-x divide-white/20 overflow-hidden rounded-[14px] rounded-tl-none" style={{ background: INK }}>
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
              <Cell k="Team loops" v={String(teamLoops)} unit={`2024: ${TEAM_2024}`} />
              {tempShown !== null && <Cell k="Baar" v={`${tempShown}°`} />}
            </>
          )}
        </div>
      </div>
      )}

      {/* Oben rechts: alle Namen */}
      {part === "plus" && (
      <div
        className="absolute right-[56px] top-[56px] w-[420px] transition-[opacity,transform] duration-700"
        style={{ opacity: v.list ? 1 : 0, transform: v.list ? "none" : "translateX(40px)" }}
      >
        <Tag wide>{v.before ? "The Swiss team" : v.over ? "Final" : "Swiss team"}</Tag>
        <ol style={{ background: INK }} className="rounded-b-[14px] py-2">
          {[...v.rows]
            .sort((a, b) => Number(a.out) - Number(b.out) || (b.laps ?? 0) - (a.laps ?? 0))
            .map((r) => (
              <li key={r.key} className="flex items-baseline justify-between px-6 py-[4px] text-[22px] font-semibold">
                <span className={r.out ? "text-white/35 line-through decoration-2" : "text-white"}>{r.name}</span>
                <span className={`tabular-nums ${r.out ? "text-white/35" : "text-white/60"}`}>
                  {r.out || v.over ? r.laps : v.before ? "" : "in"}
                </span>
              </li>
            ))}
        </ol>
      </div>
      )}

      {/* Oben rechts: Läuferkarte */}
      {part === "plus" && v.card && !v.list && (
        <div key={v.card.key} className="absolute right-[56px] top-[56px] w-[420px]" style={{ animation: "byd-in-r .6s ease-out" }}>
          <Tag wide>{v.before ? "Meet the team" : "Still running"}</Tag>
          <div className="overflow-hidden rounded-b-[14px]" style={{ background: INK }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.card.photo} alt="" className="block h-[260px] w-full object-cover" style={{ objectPosition: "50% 30%" }} />
            <div className="px-6 pb-6 pt-5">
              <div className="text-[40px] font-extrabold leading-none tracking-[-0.02em] text-white">{v.card.name}</div>
              <div className="mt-2 text-[18px] font-semibold uppercase tracking-[0.08em] text-white/60">Qualified with {v.card.qual} loops</div>
              <p className="mt-3 text-[20px] leading-snug text-white/85">{v.card.lead}</p>
            </div>
          </div>
        </div>
      )}

      {/* Oben links: Meilenstein (nur wenn kein Out läuft) */}
      {part === "plus" && v.milestone && !(v.banner && v.banner.length) && (
        <div className="absolute left-[56px] top-[56px] flex flex-col" style={{ animation: "byd-in .5s ease-out" }}>
          <Tag>Team Switzerland</Tag>
          <div className="rounded-[14px] rounded-tl-none px-9 py-6" style={{ background: INK }}>
            <div className="text-[56px] font-extrabold leading-none tracking-[-0.02em] text-white">{v.milestone}</div>
          </div>
        </div>
      )}

      {/* Unten rechts: Grüsse */}
      {part === "plus" && v.cheer && (
        <div key={v.cheer.id} className="absolute bottom-[290px] right-[56px] w-[420px]" style={{ animation: "byd-in-r .6s ease-out" }}>
          <Tag wide>{addressee(v.cheer.body) ? `Message for ${addressee(v.cheer.body)}` : "Message for the team"}</Tag>
          <div className="rounded-b-[14px] px-6 py-5" style={{ background: INK }}>
            <p className="text-[26px] font-semibold leading-snug text-white">{v.cheer.body}</p>
            <p className="mt-3 text-[18px] font-semibold uppercase tracking-[0.08em] text-white/60">{v.cheer.author}</p>
          </div>
        </div>
      )}

      {/* Oben links: ausgeschieden */}
      {part === "plus" && v.banner && v.banner.length > 0 && (
        <div key={v.banner.map((r) => r.key).join()} className="absolute left-[56px] top-[56px] flex flex-col" style={{ animation: "byd-in .5s ease-out" }}>
          <Tag>Out</Tag>
          <div className="rounded-[14px] rounded-tl-none px-9 py-6" style={{ background: INK }}>
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
      <style>{`@keyframes byd-in{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}@keyframes byd-in-r{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

const km = (laps: number) => (laps * KM).toFixed(1);

/** Ein Feld der Leiste: kleines Etikett, grosse Zahl. */
function Cell({ k, v, unit, accent }: { k: string; v: string; unit?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col justify-between px-6 py-5">
      <span className="text-[18px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent ? "#ff4d55" : "rgba(255,255,255,0.7)" }}>
        {k}
      </span>
      <span className="mt-2 whitespace-nowrap text-[58px] font-extrabold leading-[0.9] tracking-[-0.02em] tabular-nums text-white">
        {v}
        {unit && <span className="ml-2 text-[24px] text-white/50">{unit}</span>}
      </span>
    </div>
  );
}

/** Roter Kopf mit Kreuz, gleich für alle drei Teile. */
function Tag({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-t-[14px] px-5 py-3 ${wide ? "" : "self-start"}`} style={{ background: RED }}>
      <span className="relative grid h-[22px] w-[22px] place-items-center rounded-[4px] bg-white">
        <span className="absolute h-[14px] w-[4px]" style={{ background: RED }} />
        <span className="absolute h-[4px] w-[14px]" style={{ background: RED }} />
      </span>
      <span className="text-[22px] font-extrabold uppercase tracking-[0.04em] text-white">{children}</span>
    </div>
  );
}
