"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, TEAM } from "@/app/backyard/_data/event";
import { buildLog, DEFAULT_CONFIG, lastDone, lapClock, LOG_KEYS, PIERRE, testRace, type LogConfig, type LogKey, type Mark, type Milestone, type RrLap } from "@/app/backyard/_lib/studio-log";
import { FORMATS } from "./catalog";
import { cover, drawShade, H, W, type Data, type Format, type Fonts, type Lang, type StravaLap, type TeamRunner, type Vals, type Who } from "./formats";
import { HAND_CHOICES } from "./pierre";
import { record, saveFile } from "./media";
import { useLog } from "./useLog";

/**
 * Studio fürs Rennwochenende: Foto oder Video vom Handy wählen, Vorlage
 * antippen, die Grafik legt sich animiert darüber. Zahlen kommen aus
 * race|result (Team), Pierres Runden-Log (race|result, Strava, Wetter, von
 * Hand) und lassen sich jederzeit von Hand ändern. Fotos und Videos
 * verlassen das Handy nicht; das Runden-Log liegt auf dem Server.
 */

type Media = { kind: "image"; el: HTMLImageElement } | { kind: "video"; el: HTMLVideoElement; url: string } | null;
type LiveRunner = { first: string; last: string; laps: number; status: "in" | "out" | "winner" | null };
type Live = { currentLap: number; runners: LiveRunner[] };
/** aus /api/backyard/runner-laps */
type RosterRunner = { slug: string; first: string; last: string; pb: number; laps: number; status: Who["status"]; rank: number; photo: string; rr: RrLap[] };
type Strava = { laps: StravaLap[]; last: { kcal: number | null; latlng: [number, number][]; hr: number[] } | null };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const DEFAULT_BG = { team: "/backyard/team/on-the-loop.jpg", pierre: "/backyard/generator/biege-1.jpg" };
const MAX_VIDEO = 30;
const UI_KEY = "studio-ui-v1";
const OPTS_KEY = "studio-opts-v1";

const LOG_LABEL: Record<LogKey, string> = {
  zeit: "Rundenzeit (mm:ss)",
  status: "Status",
  naps: "Naps (Anzahl)",
  napMin: "Naps (Minuten)",
  pulsStuhl: "Puls im Stuhl",
  temp: "Temperatur (°C)",
  puls: "Puls Ø Runde",
  kcal: "kcal Runde",
  notiz: "Notiz",
};
const SRC_LABEL = { rr: "race|result", strava: "Strava", wetter: "Wetter", hand: "von Hand", test: "Test" } as const;

const fieldsOf = (f: Format, o: Vals) => (typeof f.fields === "function" ? f.fields(o) : f.fields);
const optDefaults = (f: Format): Vals => Object.fromEntries((f.opts ?? []).map((x) => [x.key, x.def]));

/** «Varen 2025 · 19» je Zeile ↔ Liste */
const listToText = (xs: { name: string; n: number }[]) => xs.map((x) => `${x.name} · ${String(x.n).replace(".", ",")}`).join("\n");
function textToList(s: string) {
  return s
    .split("\n")
    .map((l) => /^(.*?)[\s·;:,|]+(\d+(?:[.,]\d+)?)\s*$/.exec(l.trim()))
    .filter((m): m is RegExpExecArray => Boolean(m && m[1]))
    .map((m) => ({ name: m[1].trim(), n: Number(m[2].replace(",", ".")) }));
}

function readJson<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}
function writeJson(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* privates Fenster */
  }
}

export default function Studio({ access, k }: { access: "team" | "all"; k: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const imgs = useRef(new Map<string, HTMLImageElement>());
  const t0 = useRef(performance.now());

  const [group, setGroup] = useState<"team" | "pierre">("team");
  const [fid, setFid] = useState("t-liste");
  const [lang, setLang] = useState<Lang>("de");
  const [fonts, setFonts] = useState<Fonts>({ inter: "Inter, sans-serif", archivo: "Archivo, sans-serif", mono: "monospace" });
  const [media, setMedia] = useState<Media>(null);
  const [fy, setFy] = useState(35);
  const [fx, setFx] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [touched, setTouched] = useState<Vals>({});
  const [allOpts, setAllOpts] = useState<Record<string, Vals>>({});
  const [bare, setBare] = useState(false);
  const [sound, setSound] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string; url: string } | null>(null);
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);

  // Team-Daten
  const [live, setLive] = useState<Live | null>(null);
  const [liveMsg, setLiveMsg] = useState("Lade race|result …");
  const [test, setTest] = useState(false);
  const [testLap, setTestLap] = useState(24);
  const [manual, setManual] = useState<Record<string, { laps?: number; out?: boolean }>>({});
  const [showTeam, setShowTeam] = useState(false);

  // Läufer: alle 15 aus race|result, Standard Pierre (Vollzugang) bzw. Teamsieger
  const [roster, setRoster] = useState<RosterRunner[]>([]);
  const [rosterMsg, setRosterMsg] = useState("Lade Rundenzeiten …");
  const [runner, setRunner] = useState<string | null>(access === "all" ? PIERRE : null);
  const slug = runner ?? roster[0]?.slug ?? PIERRE;
  const full = access === "all" && slug === PIERRE;
  const cur = roster.find((r) => r.slug === slug);

  // Pierre-Daten
  const [strava, setStrava] = useState<Strava | null>(null);
  const [stravaMsg, setStravaMsg] = useState("");
  const [stravaTest, setStravaTest] = useState(false);
  const [temp, setTemp] = useState<number | null>(null);
  const [temps, setTemps] = useState<Record<string, number>>({});
  const [pTest, setPTest] = useState(false);
  const [selLap, setSelLap] = useState<number | null>(null);
  const [showLog, setShowLog] = useState(true);
  const [showList, setShowList] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const logApi = useLog(k, pTest && full ? "test" : "live", full);

  const list = FORMATS.filter((f) => f.group === group && (group === "team" || full || f.rr));
  const fmt = list.find((f) => f.id === fid) ?? list[0] ?? FORMATS[0];
  const o = useMemo<Vals>(() => {
    const v = { ...optDefaults(fmt), ...allOpts[fmt.id] };
    // Auswahlen aus Pierres Handlog gibt es bei den anderen nicht
    if (!full) for (const x of fmt.opts ?? []) if (HAND_CHOICES.has(v[x.key])) v[x.key] = HAND_CHOICES.has(x.def) ? "off" : x.def;
    return v;
  }, [fmt, allOpts, full]);

  /* Oberfläche und Schalter überleben Neuladen und Tab-Wechsel */
  useEffect(() => {
    const ui = readJson<{ group?: "team" | "pierre"; fid?: string; pTest?: boolean; lang?: Lang; runner?: string }>(UI_KEY);
    if (ui) {
      const g = ui.group === "pierre" ? "pierre" : "team";
      if (ui.runner) setRunner(ui.runner);
      setGroup(g);
      if (ui.fid && FORMATS.some((f) => f.id === ui.fid && f.group === g)) setFid(ui.fid);
      else setFid(FORMATS.find((f) => f.group === g)!.id);
      if (access === "all") setPTest(Boolean(ui.pTest));
      if (ui.lang) setLang(ui.lang);
    }
    setAllOpts(readJson<Record<string, Vals>>(OPTS_KEY) ?? {});
    setReady(true);
  }, [access]);
  useEffect(() => {
    if (ready) writeJson(UI_KEY, { group, fid, pTest, lang, runner });
  }, [ready, group, fid, pTest, lang, runner]);
  useEffect(() => {
    if (ready) writeJson(OPTS_KEY, allOpts);
  }, [ready, allOpts]);

  /* Schriften: Archivo kommt vom Layout, Inter und Geist Mono von der Seite */
  useEffect(() => {
    const el = root.current ?? document.body;
    const cs = getComputedStyle(el);
    const f: Fonts = {
      inter: cs.getPropertyValue("--font-inter").trim() || "Inter, sans-serif",
      archivo: cs.getPropertyValue("--font-archivo").trim() || "Archivo, sans-serif",
      mono: cs.getPropertyValue("--font-geist-mono").trim() || "monospace",
    };
    Promise.all([
      document.fonts.load(`900 100px ${f.inter}`),
      document.fonts.load(`700 40px ${f.inter}`),
      document.fonts.load(`800 100px ${f.archivo}`),
      document.fonts.load(`500 30px ${f.mono}`),
    ])
      .catch(() => null)
      .then(() => setFonts(f));
  }, []);

  /* race|result alle 30 s */
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE}/live${test ? "?year=2024" : ""}`, { cache: "no-store" });
        const j = await r.json();
        if (stop) return;
        if (!r.ok || !Array.isArray(j.runners)) {
          setLive(null);
          setLiveMsg("Noch keine Live-Daten. Team-Stand von Hand eintragen.");
          return;
        }
        setLive(j);
        setLiveMsg(test ? "Test mit den Schweizer Resultaten 2024, Runde frei wählbar." : `Live: Runde ${j.currentLap}, aktualisiert ${new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}.`);
      } catch {
        if (!stop) setLiveMsg("race|result nicht erreichbar. Team-Stand von Hand eintragen.");
      }
    };
    load();
    const iv = setInterval(load, 30_000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [test]);

  /* Rundenzeiten aller Läufer (race|result), team- und all-Schlüssel */
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE}/runner-laps?k=${encodeURIComponent(k)}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Fehler");
        if (stop) return;
        setRoster(j.runners ?? []);
        setRosterMsg("");
      } catch {
        if (!stop) setRosterMsg("Rundenzeiten nicht erreichbar. Felder lassen sich von Hand füllen.");
      }
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [k]);

  /* Strava, nur mit Vollzugang */
  const loadStrava = useCallback(async () => {
    if (access !== "all") return;
    setStravaMsg("Lade Strava …");
    try {
      const r = await fetch(`${API_BASE}/strava?k=${encodeURIComponent(k)}${stravaTest ? "&since=2026-10-12" : ""}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Strava-Fehler");
      setStrava(j);
      setStravaMsg(j.laps.length ? `Strava: ${j.laps.length} Runde${j.laps.length === 1 ? "" : "n"}, letzte ${new Date(j.laps.at(-1).start).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} gestartet.` : "Strava: noch keine Runde seit dem Start.");
    } catch (e) {
      setStrava(null);
      setStravaMsg(`${(e as Error).message} Kein Problem: alles geht auch ohne Strava.`);
    }
  }, [access, k, stravaTest]);
  useEffect(() => {
    loadStrava();
    const iv = setInterval(loadStrava, 60_000);
    return () => clearInterval(iv);
  }, [loadStrava]);

  /* Temperatur in Baar (Open-Meteo, ohne Schlüssel): jetzt und je Stunde */
  useEffect(() => {
    if (access !== "all") return;
    const load = () =>
      fetch("https://api.open-meteo.com/v1/forecast?latitude=47.195&longitude=8.529&current=temperature_2m&hourly=temperature_2m&past_days=5&forecast_days=1&timezone=GMT")
        .then((r) => r.json())
        .then((j) => {
          setTemp(typeof j?.current?.temperature_2m === "number" ? j.current.temperature_2m : null);
          const m: Record<string, number> = {};
          (j?.hourly?.time ?? []).forEach((tm: string, i: number) => {
            const v = j.hourly.temperature_2m?.[i];
            if (typeof v === "number" && Date.parse(`${tm}:00Z`) <= Date.now()) m[tm] = v;
          });
          setTemps(m);
        })
        .catch(() => null);
    load();
    const iv = setInterval(load, 15 * 60_000);
    return () => clearInterval(iv);
  }, [access]);

  /* Team-Stand: race|result → Kader, im Test als Wiederholung von 2024 */
  const team = useMemo(() => {
    const base: TeamRunner[] = TEAM.map((a) => ({ first: a.first, last: a.name, photo: a.photo, pb: a.pb, laps: 0, out: false }));
    let lap = 0;
    if (live && test) {
      // 2024er Resultate der Reihe nach auf den heutigen Kader legen
      const finals = [...live.runners].map((r) => r.laps).sort((a, b) => b - a);
      lap = testLap;
      base.forEach((r, i) => {
        const fin = finals[i] ?? 0;
        r.laps = Math.min(fin, testLap);
        r.out = fin < testLap;
      });
    } else if (live) {
      lap = live.currentLap;
      base.forEach((r) => {
        const hit = live.runners.find((x) => norm(x.last) === norm(r.last));
        if (!hit) return;
        r.laps = hit.laps;
        r.out = hit.status ? hit.status === "out" : hit.laps < live.currentLap;
      });
    }
    base.forEach((r) => {
      const m = manual[r.last];
      if (m?.laps !== undefined) r.laps = m.laps;
      if (m?.out !== undefined) r.out = m.out;
    });
    if (!lap) lap = Math.max(0, ...base.map((r) => r.laps));
    return { lap, runners: base };
  }, [live, test, testLap, manual]);

  /* Pierres Runden-Log */
  const testRows = useMemo(() => testRace(), []);
  const log = useMemo(
    () =>
      full
        ? buildLog({ rr: logApi.rr, strava: strava?.laps ?? [], temps, manual: logApi.manual, test: pTest ? testRows : undefined })
        : buildLog({ rr: cur?.rr ?? [], strava: [], temps: {}, manual: {} }),
    [full, cur, logApi.rr, logApi.manual, strava, temps, pTest, testRows],
  );
  const latest = lastDone(log);
  const maxLap = Math.max(latest + 1, log.length, 1);
  const sel = Math.max(1, Math.min(selLap ?? latest, maxLap));
  const selRow = log.find((r) => r.lap === sel);

  const who: Who = useMemo(() => {
    const a = TEAM.find((x) => x.photo === slug);
    return {
      slug,
      first: cur?.first ?? a?.first ?? "",
      last: cur?.last ?? a?.name ?? "",
      full,
      pb: cur?.pb ?? a?.pb ?? 0,
      laps: cur?.laps ?? latest,
      status: cur?.status ?? "in",
      rank: cur?.rank ?? 0,
      of: roster.length || TEAM.length,
    };
  }, [slug, cur, full, latest, roster.length]);

  const data: Data = useMemo(() => {
    const rr = live?.runners.find((x) => norm(x.last) === norm(who.last));
    return {
      lang,
      team,
      pierre: {
        laps: full ? (strava?.laps ?? []) : [],
        kcal: full ? (strava?.last?.kcal ?? null) : null,
        latlng: full ? (strava?.last?.latlng ?? []) : [],
        hr: full ? (strava?.last?.hr ?? []) : [],
        temp: full ? temp : null,
        rrLaps: test ? 0 : (rr?.laps ?? 0),
        log,
        sel,
        config: full ? logApi.config : DEFAULT_CONFIG,
        who,
      },
    };
  }, [lang, team, strava, temp, live, test, log, sel, logApi.config, full, who]);

  /* Felder: automatisch aus den Daten, von Hand Getipptes gewinnt */
  const auto = useMemo(() => fmt.prefill(data, o), [fmt, data, o]);
  const vals = useMemo(() => ({ ...auto, ...touched }), [auto, touched]);

  const pickFormat = (f: Format) => {
    setFid(f.id);
    setTouched({});
    t0.current = performance.now();
    setResult(null);
  };
  const setOpt = (key: string, value: string) => {
    setAllOpts((a) => ({ ...a, [fmt.id]: { ...a[fmt.id], [key]: value } }));
    t0.current = performance.now();
  };
  const pickLap = (n: number | null) => {
    setSelLap(n);
    setTouched({});
    t0.current = performance.now();
  };

  const img = useCallback((src: string) => {
    const m = imgs.current.get(src);
    if (m) return m.complete && m.naturalWidth ? m : null;
    const el = new Image();
    el.src = src;
    imgs.current.set(src, el);
    return null;
  }, []);

  const [shade, shadeK] = fmt.shadeFor ? fmt.shadeFor(o) : [fmt.shade, 1];

  /* Ein Bild zeichnen: Hintergrund, Verlauf, Vorlage. `bare`: nur die Grafik, durchsichtig. */
  const frame = useCallback(
    (t: number, opts: { kenBurns?: number; bare?: boolean } = {}) => {
      const ctx = canvas.current?.getContext("2d");
      if (!ctx) return;
      if (opts.bare) ctx.clearRect(0, 0, W, H);
      else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        const z = zoom * (1 + (opts.kenBurns ?? 0));
        if (media?.kind === "video" && media.el.videoWidth) cover(ctx, media.el, 0, 0, W, H, fx, fy, z, media.el.videoWidth, media.el.videoHeight);
        else if (media?.kind === "image") cover(ctx, media.el, 0, 0, W, H, fx, fy, z);
        else {
          const d = img(fmt.group === "pierre" && !full && cur ? cur.photo : DEFAULT_BG[fmt.group]);
          if (d) cover(ctx, d, 0, 0, W, H, fx, fy, z);
        }
        drawShade(ctx, shade, shadeK);
      }
      fmt.draw({ ctx, t, f: fonts, img, lang }, vals, data, o);
    },
    [media, fx, fy, zoom, fmt, fonts, img, lang, vals, data, o, shade, shadeK, full, cur],
  );

  /* Vorschau in Schleife */
  useEffect(() => {
    if (busy !== null) return;
    let raf = 0;
    const loop = () => {
      const cycle = fmt.len + 2;
      const t = ((performance.now() - t0.current) / 1000) % cycle;
      frame(t, { bare });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frame, fmt, busy, bare]);

  /* Foto oder Video wählen */
  const onFile = (file: File | undefined) => {
    if (!file) return;
    setErr("");
    setResult(null);
    if (media?.kind === "video") URL.revokeObjectURL(media.url);
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.src = url;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = "auto";
      v.onloadeddata = () => {
        v.play().catch(() => null);
        setMedia({ kind: "video", el: v, url });
      };
    } else {
      const el = new Image();
      el.onload = () => setMedia({ kind: "image", el });
      el.src = url;
    }
    t0.current = performance.now();
  };

  const stamp = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const savePng = () => {
    frame(99, { bare });
    canvas.current?.toBlob((b) => b && setResult({ blob: b, name: `${fmt.id}${bare ? "-sticker" : ""}-${stamp()}.png`, url: URL.createObjectURL(b) }), "image/png");
  };

  const saveVideo = async () => {
    const c = canvas.current;
    if (!c) return;
    setErr("");
    setResult(null);
    setBusy(0);
    try {
      let video: HTMLVideoElement | undefined;
      let duration = Math.max(5, fmt.len + 2.5);
      if (media?.kind === "video") {
        // frisches Element: createMediaElementSource geht pro Element nur einmal
        video = document.createElement("video");
        video.src = media.url;
        video.playsInline = true;
        video.preload = "auto";
        await new Promise((r) => (video!.onloadeddata = r));
        duration = Math.min(MAX_VIDEO, video.duration || duration);
      }
      const recFrame = (t: number) => {
        if (video) {
          const ctx = c.getContext("2d")!;
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, W, H);
          cover(ctx, video, 0, 0, W, H, fx, fy, zoom, video.videoWidth, video.videoHeight);
          drawShade(ctx, shade, shadeK);
          fmt.draw({ ctx, t, f: fonts, img, lang }, vals, data, o);
        } else frame(t, { kenBurns: 0.06 * (t / duration) });
      };
      const blob = await record({ canvas: c, frame: recFrame, duration, video, cues: fmt.cues(vals, o), sound, onProgress: (p) => setBusy(Math.round(p * 20) / 20) });
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      setResult({ blob, name: `${fmt.id}-${stamp()}.${ext}`, url: URL.createObjectURL(blob) });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
      t0.current = performance.now();
    }
  };

  const runnerOptions = team.runners.map((r) => ({ v: r.last, l: `${r.first} ${r.last}` }));
  const fields = fieldsOf(fmt, o);
  const opts = (fmt.opts ?? [])
    .filter((x) => !x.when || x.when(o))
    .map((x) => (full || !x.choices ? x : { ...x, choices: x.choices.filter(([v]) => !HAND_CHOICES.has(v)) }));
  const pickRunner = (s: string) => {
    setRunner(s);
    setSelLap(null);
    setTouched({});
    t0.current = performance.now();
    setResult(null);
  };
  const lapChoices = Array.from({ length: maxLap }, (_, i) => i + 1);

  return (
    <div ref={root} className="studio">
      <header className="st-head">
        <h1>Studio</h1>
        <div className="st-tabs">
          {(["team", "pierre"] as const).map((g) => (
            <button
              key={g}
              className={group === g ? "on" : ""}
              onClick={() => {
                setGroup(g);
                pickFormat(FORMATS.find((f) => f.group === g)!);
              }}
            >
              {g === "team" ? "Team" : "Läufer"}
            </button>
          ))}
        </div>
      </header>

      {group === "pierre" && (
        <div className="st-lap">
          <select value={slug} onChange={(e) => pickRunner(e.target.value)} aria-label="Läufer">
            {(roster.length ? roster : TEAM.filter((a) => a.photo).map((a) => ({ slug: a.photo!, first: a.first, last: a.name, laps: 0, status: "in" as const }))).map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.first} {r.last}
                {r.laps ? ` · ${r.laps} Runden${r.status === "winner" ? " · Sieger" : ""}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="st-msg">
        {group === "team"
          ? liveMsg
          : !full
            ? rosterMsg || `${who.first} ${who.last}: ${who.laps} Runden laut race|result${who.status === "out" ? ", danach ausgeschieden" : ""}. Strava, Puls, Naps und Wetter gibt es nur bei Pierre.`
            : pTest
              ? "Testrennen: 36 Runden, erfunden. Änderungen landen im Test-Log."
              : stravaMsg}
        {group === "pierre" && full && !pTest && (
          <button className="st-link" onClick={loadStrava}>
            neu laden
          </button>
        )}
      </p>

      {group === "pierre" && (
        <div className="st-lap">
          <button onClick={() => pickLap(Math.max(1, sel - 1))} aria-label="Runde zurück">
            ‹
          </button>
          <select value={sel} onChange={(e) => pickLap(Number(e.target.value) === latest ? null : Number(e.target.value))}>
            {lapChoices.map((n) => (
              <option key={n} value={n}>
                Runde {n}
                {n === latest ? " (letzte)" : n > latest ? " (neu)" : ""}
              </option>
            ))}
          </select>
          <button onClick={() => pickLap(Math.min(maxLap, sel + 1))} aria-label="Runde vor">
            ›
          </button>
          {selLap !== null && selLap !== latest && (
            <button className="st-link" onClick={() => pickLap(null)}>
              zur letzten
            </button>
          )}
        </div>
      )}

      <div className="st-formats">
        {list.map((f) => (
          <button key={f.id} className={f.id === fmt.id ? "on" : ""} onClick={() => pickFormat(f)}>
            {!full && f.id === "p-marken" ? "Bestleistung" : f.name}
          </button>
        ))}
      </div>

      <div className="st-stage">
        <canvas ref={canvas} width={W} height={H} className={bare ? "bare" : ""} />
        {busy !== null && (
          <div className="st-busy">
            <span>Video wird aufgenommen … {Math.round(busy * 100)} %</span>
            <small>Bildschirm anlassen, App nicht wechseln.</small>
          </div>
        )}
      </div>

      <label className="st-file">
        {media ? "Anderes Foto oder Video" : "Foto oder Video wählen"}
        <input type="file" accept="image/*,video/*" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>

      <div className="st-grid">
        <label>
          Ausschnitt hoch/runter
          <input type="range" min={0} max={100} value={fy} onChange={(e) => setFy(Number(e.target.value))} />
        </label>
        <label>
          Ausschnitt links/rechts
          <input type="range" min={0} max={100} value={fx} onChange={(e) => setFx(Number(e.target.value))} />
        </label>
        <label>
          Zoom
          <input type="range" min={100} max={200} value={zoom * 100} onChange={(e) => setZoom(Number(e.target.value) / 100)} />
        </label>
      </div>

      {opts.length > 0 && (
        <div className="st-opts">
          {opts.map((x) =>
            x.choices ? (
              <label key={x.key}>
                {x.label}
                <select value={o[x.key]} onChange={(e) => setOpt(x.key, e.target.value)}>
                  {x.choices.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label key={x.key} className="st-check">
                <input type="checkbox" checked={o[x.key] === "1"} onChange={(e) => setOpt(x.key, e.target.checked ? "1" : "0")} /> {x.label}
              </label>
            ),
          )}
        </div>
      )}

      {fields.length > 0 && (
        <div className="st-fields">
          {fields.map((fl) => (
            <label key={fl.key}>
              {fl.label}
              {fl.kind === "runner" ? (
                <select
                  value={vals[fl.key] ?? ""}
                  onChange={(e) => {
                    const r = team.runners.find((x) => x.last === e.target.value);
                    setTouched((v) => ({ ...v, [fl.key]: e.target.value, ...(fl.key === "wer" && "runden" in vals && r ? { runden: String(r.laps) } : {}) }));
                  }}
                >
                  {runnerOptions.map((x) => (
                    <option key={x.v} value={x.v}>
                      {x.l}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={vals[fl.key] ?? ""} onChange={(e) => setTouched((v) => ({ ...v, [fl.key]: e.target.value }))} />
              )}
            </label>
          ))}
          {Object.keys(touched).length > 0 && (
            <button className="st-link" onClick={() => setTouched({})}>
              Texte und Zahlen wieder automatisch
            </button>
          )}
        </div>
      )}

      <div className="st-actions">
        {media?.kind !== "video" || bare ? (
          <button onClick={savePng} disabled={busy !== null}>
            Bild{bare ? " (transparent)" : ""}
          </button>
        ) : null}
        <button className="primary" onClick={saveVideo} disabled={busy !== null || bare}>
          {media?.kind === "video" ? "Video mit Grafik" : "Animiertes Video"}
        </button>
        <button onClick={() => (t0.current = performance.now())}>Nochmal abspielen</button>
      </div>
      <label className="st-check">
        <input type="checkbox" checked={bare} onChange={(e) => setBare(e.target.checked)} /> Bild ohne Hintergrund (transparentes PNG als Sticker)
      </label>
      <label className="st-check">
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Leise Toneffekte im Video
      </label>

      {err && <p className="st-err">{err}</p>}
      {result && (
        <div className="st-result">
          {result.blob.type.startsWith("video") ? <video src={result.url} controls playsInline /> : <img src={result.url} alt="" className={bare ? "bare" : ""} />}
          <button className="primary" onClick={() => saveFile(result.blob, result.name)}>
            Speichern oder teilen
          </button>
        </div>
      )}

      {group === "team" && (
        <section className="st-team">
          <div className="st-row">
            <label className="st-check">
              <input type="checkbox" checked={lang === "en"} onChange={(e) => setLang(e.target.checked ? "en" : "de")} /> Englisch
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={test}
                onChange={(e) => {
                  setTest(e.target.checked);
                  setManual({});
                }}
              />{" "}
              Testmodus 2024
            </label>
          </div>
          {test && (
            <label className="st-range">
              Rennen nachspielen bis Runde {testLap}
              <input type="range" min={1} max={60} value={testLap} onChange={(e) => setTestLap(Number(e.target.value))} />
            </label>
          )}
          <button className="st-link" onClick={() => setShowTeam((s) => !s)}>
            {showTeam ? "Team-Stand ausblenden" : "Team-Stand von Hand korrigieren"}
          </button>
          {showTeam && (
            <div className="st-table">
              {team.runners.map((r) => (
                <div key={r.last}>
                  <span>
                    {r.first} {r.last}
                  </span>
                  <input
                    inputMode="numeric"
                    value={r.laps}
                    onChange={(e) => setManual((m) => ({ ...m, [r.last]: { ...m[r.last], laps: Number(e.target.value) || 0 } }))}
                  />
                  <label>
                    <input type="checkbox" checked={r.out} onChange={(e) => setManual((m) => ({ ...m, [r.last]: { ...m[r.last], out: e.target.checked } }))} /> raus
                  </label>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {group === "pierre" && !full && (
        <section className="st-team">
          <button className="st-link st-h" onClick={() => setShowList((s) => !s)}>
            {showList ? "Übersicht ausblenden" : `Übersicht aller ${log.length} Runden`}
          </button>
          {showList && (
            <div className="st-loglist">
              {log.map((r) => (
                <button key={r.lap} className={r.lap === sel ? "on" : ""} onClick={() => pickLap(r.lap === latest ? null : r.lap)}>
                  <b>R{r.lap}</b>
                  <span>{r.zeit || "–"}</span>
                  <span>{r.status === "out" ? "raus" : ""}</span>
                  <span />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {group === "pierre" && full && (
        <section className="st-team">
          <div className="st-loghead">
            <button className="st-link st-h" onClick={() => setShowLog((s) => !s)}>
              Runden-Log · Runde {sel} {showLog ? "▾" : "▸"}
            </button>
            <span className="st-small">{logApi.msg}</span>
          </div>
          {showLog && (
            <div className="st-log">
              {LOG_KEYS.map((key) => {
                const src = selRow?.src[key];
                const v = selRow?.[key] ?? "";
                return (
                  <label key={key}>
                    <span>
                      {LOG_LABEL[key]}
                      {src && <em className={`src-${src}`}>{SRC_LABEL[src]}</em>}
                      {src === "hand" && (
                        <button className="st-link" onClick={() => logApi.resetField(sel, key)}>
                          zurück
                        </button>
                      )}
                    </span>
                    {key === "status" ? (
                      <select value={v} onChange={(e) => logApi.setField(sel, key, e.target.value)}>
                        <option value="">–</option>
                        <option value="in">im Rennen</option>
                        <option value="out">raus</option>
                      </select>
                    ) : (
                      <input
                        value={v}
                        inputMode={key === "notiz" ? "text" : key === "zeit" ? "text" : "decimal"}
                        placeholder={key === "zeit" ? "53:20" : ""}
                        onChange={(e) => logApi.setField(sel, key, e.target.value)}
                      />
                    )}
                  </label>
                );
              })}
              <p className="st-small">
                Runde {sel} läuft {lapClock(sel)}–{lapClock(sel + 1)}. Leere Felder bleiben leer in der Grafik.
              </p>
            </div>
          )}

          <button className="st-link" onClick={() => setShowList((s) => !s)}>
            {showList ? "Übersicht ausblenden" : `Übersicht aller ${log.length} Runden`}
          </button>
          {showList && (
            <div className="st-loglist">
              {log.map((r) => (
                <button key={r.lap} className={r.lap === sel ? "on" : ""} onClick={() => pickLap(r.lap === latest ? null : r.lap)}>
                  <b>R{r.lap}</b>
                  <span>{r.zeit || "–"}</span>
                  <span>{r.status === "out" ? "raus" : r.napMin ? `Nap ${r.napMin}′` : ""}</span>
                  <span>{r.temp ? `${r.temp}°` : ""}</span>
                </button>
              ))}
            </div>
          )}

          <button className="st-link" onClick={() => setShowConfig((s) => !s)}>
            {showConfig ? "Marken und Meilensteine ausblenden" : "Eigene Marken und Meilensteine"}
          </button>
          {showConfig && <ConfigEditor config={logApi.config} onChange={logApi.setConfig} />}

          <div className="st-row">
            <label className="st-check">
              <input
                type="checkbox"
                checked={pTest}
                onChange={(e) => {
                  setPTest(e.target.checked);
                  pickLap(null);
                }}
              />{" "}
              Testrennen (36 Runden)
            </label>
            {pTest && (
              <button className="st-link" onClick={() => confirm("Alle Handeinträge im Testrennen löschen?") && logApi.resetTest()}>
                Test zurücksetzen
              </button>
            )}
          </div>
          <label className="st-check">
            <input type="checkbox" checked={stravaTest} onChange={(e) => setStravaTest(e.target.checked)} /> Strava: Trainingslauf vom 12.10. für Karte und Pulslinie
          </label>
        </section>
      )}
    </div>
  );
}

function ConfigEditor({ config, onChange }: { config: LogConfig; onChange: (c: LogConfig) => void }) {
  const [marks, setMarks] = useState(() => listToText(config.marks.map((m) => ({ name: m.name, n: m.laps }))));
  const [miles, setMiles] = useState(() => listToText(config.miles.map((m) => ({ name: m.name, n: m.km }))));
  const save = () =>
    onChange({
      marks: textToList(marks).map((x): Mark => ({ name: x.name, laps: Math.round(x.n) })),
      miles: textToList(miles).map((x): Milestone => ({ name: x.name, km: x.n })),
    });
  return (
    <div className="st-fields">
      <label>
        Eigene Marken (Name · Runden, eine pro Zeile). Erscheinen erst, wenn übertroffen.
        <textarea rows={5} value={marks} onChange={(e) => setMarks(e.target.value)} onBlur={save} />
      </label>
      <label>
        Kilometer-Meilensteine (Name · km)
        <textarea rows={6} value={miles} onChange={(e) => setMiles(e.target.value)} onBlur={save} />
      </label>
    </div>
  );
}
