/**
 * Pierres Runden-Log fürs Studio: eine Zeile pro Runde, zusammengesetzt
 * aus vier Quellen. Von Hand schlägt race|result, race|result schlägt
 * Strava und Wetter. Strava ist nur ein Extra und füllt Lücken.
 *
 * Alle Werte sind Text, so wie Minh sie tippt. Leer heisst «weiss nicht».
 * Läuft auf dem Server (Cron, API) und im Browser.
 */

export const RACE_START_MS = Date.parse("2026-10-17T12:00:00Z"); // 14:00 in Baar
export const LOOP_KM = 6.706;
export const PIERRE = "biege";

export const LOG_KEYS = ["zeit", "status", "naps", "napMin", "pulsStuhl", "temp", "puls", "kcal", "notiz"] as const;
export type LogKey = (typeof LOG_KEYS)[number];
export type Source = "rr" | "strava" | "wetter" | "hand" | "test";
export type LapManual = Partial<Record<LogKey, string>>;
export type LapRow = Record<LogKey, string> & { lap: number; src: Partial<Record<LogKey, Source>> };

export type RrLap = { lap: number; lap_time: string | null; status: string | null };
export type StravaLapIn = { start: string; elapsed: number; avgHr: number | null; kcal?: number | null };

/** Eigene Marken und Kilometer-Meilensteine, gepflegt im Studio */
export type Mark = { name: string; laps: number };
export type Milestone = { name: string; km: number };
export type LogConfig = { marks: Mark[]; miles: Milestone[] };
export const DEFAULT_CONFIG: LogConfig = {
  marks: [
    { name: "Varen 2025", laps: 19 },
    { name: "Witiker 2026", laps: 23 },
    { name: "LSU 2026", laps: 33 },
    { name: "Bestleistung", laps: 40 },
  ],
  miles: [
    { name: "Marathon", km: 42.2 },
    { name: "100 km", km: 100 },
    { name: "100 Meilen", km: 160.9 },
    { name: "200 km", km: 200 },
    { name: "300 km", km: 300 },
    { name: "200 Meilen", km: 321.9 },
  ],
};

export const normName = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

/** «0:42:26», «42:26.3», «00:42:26» → «42:26». Unbrauchbares → null. */
export function toMmss(s: string | null | undefined): string | null {
  const m = /^\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,]\d+)?\s*$/.exec(s ?? "");
  if (!m) return null;
  const sec = Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  if (!sec || sec >= 3600 * 2) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** «53:20» → 3200 Sekunden */
export function secOf(s: string | undefined): number | null {
  const m = /^\s*(\d{1,3}):(\d{2})\s*$/.exec(s ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
export const numOf = (s: string | undefined): number | null => {
  const t = (s ?? "").trim().replace(",", ".").replace(/[’']/g, "");
  if (!t || !/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
};
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** Runden 6–18 und 30–42 laufen in der Nacht (Sonnenuntergang 18:37, Aufgang ca. 07:45) */
export const isNight = (lap: number) => (lap >= 6 && lap <= 18) || (lap >= 30 && lap <= 42);
export const nightOf = (lap: number) => (lap >= 6 && lap <= 18 ? 1 : lap >= 30 && lap <= 42 ? 2 : 0);
export const NIGHTS: Record<number, [number, number]> = { 1: [6, 18], 2: [30, 42] };
/** Runde N startet um 13 + N Uhr */
export const lapStartMs = (lap: number) => RACE_START_MS + (lap - 1) * 3_600_000;
export const lapClock = (lap: number) => `${String((13 + lap) % 24).padStart(2, "0")}:00`;

export type Sources = {
  rr: RrLap[];
  strava: StravaLapIn[];
  /** Temperatur je volle Stunde (UTC-ISO «2026-10-17T12:00») */
  temps: Record<string, number>;
  manual: Record<number, LapManual>;
  /** Testrennen statt echter Quellen */
  test?: LapRow[];
};

export function buildLog(s: Sources): LapRow[] {
  const auto = new Map<number, LapRow>();
  const row = (lap: number) => {
    let r = auto.get(lap);
    if (!r) {
      r = { lap, zeit: "", status: "", naps: "", napMin: "", pulsStuhl: "", temp: "", puls: "", kcal: "", notiz: "", src: {} };
      auto.set(lap, r);
    }
    return r;
  };
  const put = (lap: number, k: LogKey, v: string | null | undefined, src: Source) => {
    if (v === null || v === undefined || v === "") return;
    const r = row(lap);
    if (r[k]) return; // wer zuerst kommt (höhere Priorität), gewinnt
    r[k] = v;
    r.src[k] = src;
  };

  if (s.test) {
    for (const t of s.test) for (const k of LOG_KEYS) put(t.lap, k, t[k], "test");
  } else {
    // 1. race|result
    const rrMax = Math.max(0, ...s.rr.map((r) => r.lap));
    for (const r of s.rr) {
      put(r.lap, "zeit", toMmss(r.lap_time), "rr");
      put(r.lap, "status", "in", "rr");
    }
    for (let l = 1; l <= rrMax; l++) put(l, "status", "in", "rr");
    if (s.rr.some((r) => r.status === "out")) put(rrMax + 1, "status", "out", "rr");
    // 2. Strava, Runde aus der Startzeit
    for (const a of s.strava) {
      const lap = Math.floor((Date.parse(a.start) - RACE_START_MS + 10 * 60_000) / 3_600_000) + 1;
      if (lap < 1) continue;
      put(lap, "zeit", a.elapsed > 0 && a.elapsed < 3600 ? mmss(a.elapsed) : null, "strava");
      put(lap, "puls", a.avgHr ? String(a.avgHr) : null, "strava");
      put(lap, "kcal", a.kcal ? String(a.kcal) : null, "strava");
    }
    // 3. Wetter je Runde (Stunde des Rundenstarts), nur für Runden mit anderem Inhalt
    const known = Math.max(0, ...auto.keys(), ...Object.keys(s.manual).map(Number));
    for (let l = 1; l <= known; l++) {
      const iso = new Date(lapStartMs(l)).toISOString().slice(0, 13) + ":00";
      const t = s.temps[iso];
      if (typeof t === "number") put(l, "temp", String(Math.round(t)), "wetter");
    }
  }

  // 4. Von Hand gewinnt immer, auch ein bewusst geleertes Feld
  const laps = new Set([...auto.keys(), ...Object.keys(s.manual).map(Number).filter((n) => n > 0)]);
  const max = Math.max(0, ...laps);
  const out: LapRow[] = [];
  for (let l = 1; l <= max; l++) {
    const r = { ...row(l), src: { ...row(l).src } };
    const m = s.manual[l] ?? {};
    for (const k of LOG_KEYS) {
      if (k in m) {
        r[k] = m[k] ?? "";
        r.src[k] = "hand";
      }
    }
    out.push(r);
  }
  return out;
}

/** Letzte Runde, die Pierre fertig gelaufen ist */
export const lastDone = (log: LapRow[]) => {
  for (let i = log.length - 1; i >= 0; i--) if (log[i].status !== "out" && (log[i].zeit || log[i].status === "in")) return log[i].lap;
  return 0;
};

/* ---------- Testrennen: 36 Runden, erfunden, aber plausibel ---------- */

function rand(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

export function testRace(): LapRow[] {
  const r = rand(17);
  const rows: LapRow[] = [];
  const N = 36;
  for (let lap = 1; lap <= N + 1; lap++) {
    const night = isNight(lap);
    const tired = lap / N;
    const zeit = Math.round(2580 + tired * 420 + (night ? 180 : 0) + r() * 150);
    const nap = night && r() < 0.55;
    const hour = (13 + lap) % 24;
    const temp = Math.round(hour >= 14 && hour <= 17 ? 13 + r() * 2 : hour > 17 || hour < 8 ? 5 + r() * 3 : 9 + r() * 3);
    const base: LapRow = {
      lap, zeit: mmss(zeit), status: "in", naps: nap ? "1" : "", napMin: nap ? String(Math.min(Math.floor((3600 - zeit) / 60) - 1, 2 + Math.floor(r() * 5))) : "",
      pulsStuhl: String(Math.round(72 + r() * 18 + tired * 6)), temp: String(temp),
      puls: String(Math.round(124 - tired * 8 + r() * 6)), kcal: String(Math.round(560 + r() * 70)), notiz: "", src: {},
    };
    if (lap === N + 1) rows.push({ ...base, zeit: "", status: "out", naps: "", napMin: "", pulsStuhl: "", puls: "", kcal: "" });
    else rows.push(base);
  }
  return rows;
}
