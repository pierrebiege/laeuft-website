"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, TEAM } from "@/app/backyard/_data/event";
import { cover, drawShade, FORMATS, H, W, type Data, type Format, type Fonts, type Lang, type StravaLap, type TeamRunner, type Vals } from "./formats";
import { record, saveFile } from "./media";

/**
 * Studio fürs Rennwochenende: Foto oder Video vom Handy wählen, Vorlage
 * antippen, die Grafik legt sich animiert darüber. Zahlen kommen aus
 * race|result (Team) und Strava (Pierre) und lassen sich jederzeit von
 * Hand ändern. Alles passiert im Browser, Fotos und Videos verlassen das
 * Handy nicht.
 */

type Media = { kind: "image"; el: HTMLImageElement } | { kind: "video"; el: HTMLVideoElement; url: string } | null;
type LiveRunner = { first: string; last: string; laps: number; status: "in" | "out" | "winner" | null };
type Live = { currentLap: number; runners: LiveRunner[] };
type Strava = { laps: StravaLap[]; last: { kcal: number | null; latlng: [number, number][]; hr: number[] } | null };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const DEFAULT_BG = { team: "/backyard/team/on-the-loop.jpg", pierre: "/backyard/generator/biege-1.jpg" };
const MAX_VIDEO = 30;

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
  const [vals, setVals] = useState<Vals>({});
  const [edited, setEdited] = useState(false);
  const [sound, setSound] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string; url: string } | null>(null);
  const [err, setErr] = useState("");

  // Team-Daten
  const [live, setLive] = useState<Live | null>(null);
  const [liveMsg, setLiveMsg] = useState("Lade race|result …");
  const [test, setTest] = useState(false);
  const [testLap, setTestLap] = useState(24);
  const [manual, setManual] = useState<Record<string, { laps?: number; out?: boolean }>>({});
  const [showTeam, setShowTeam] = useState(false);

  // Pierre-Daten
  const [strava, setStrava] = useState<Strava | null>(null);
  const [stravaMsg, setStravaMsg] = useState("");
  const [stravaTest, setStravaTest] = useState(false);
  const [temp, setTemp] = useState<number | null>(null);

  const fmt = FORMATS.find((f) => f.id === fid) ?? FORMATS[0];
  const list = FORMATS.filter((f) => f.group === group);

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
      setStravaMsg(`${(e as Error).message} Werte von Hand eintragen.`);
    }
  }, [access, k, stravaTest]);
  useEffect(() => {
    loadStrava();
    const iv = setInterval(loadStrava, 60_000);
    return () => clearInterval(iv);
  }, [loadStrava]);

  /* Temperatur in Baar (Open-Meteo, ohne Schlüssel) */
  useEffect(() => {
    if (access !== "all") return;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=47.195&longitude=8.529&current=temperature_2m")
      .then((r) => r.json())
      .then((j) => setTemp(typeof j?.current?.temperature_2m === "number" ? j.current.temperature_2m : null))
      .catch(() => null);
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

  const data: Data = useMemo(() => {
    const rr = live?.runners.find((x) => norm(x.last) === "biege");
    return {
      lang,
      team,
      pierre: {
        laps: strava?.laps ?? [],
        kcal: strava?.last?.kcal ?? null,
        latlng: strava?.last?.latlng ?? [],
        hr: strava?.last?.hr ?? [],
        temp,
        rrLaps: test ? 0 : (rr?.laps ?? 0),
      },
    };
  }, [lang, team, strava, temp, live, test]);

  /* Felder neu füllen, solange nichts von Hand geändert ist */
  useEffect(() => {
    if (!edited) setVals(fmt.prefill(data));
  }, [fmt, data, edited]);

  const pickFormat = (f: Format) => {
    setFid(f.id);
    setEdited(false);
    setVals(f.prefill(data));
    t0.current = performance.now();
    setResult(null);
  };

  const img = useCallback((src: string) => {
    const m = imgs.current.get(src);
    if (m) return m.complete && m.naturalWidth ? m : null;
    const el = new Image();
    el.src = src;
    imgs.current.set(src, el);
    return null;
  }, []);

  /* Ein Bild zeichnen: Hintergrund, Verlauf, Vorlage */
  const frame = useCallback(
    (t: number, opts: { kenBurns?: number } = {}) => {
      const ctx = canvas.current?.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      const z = zoom * (1 + (opts.kenBurns ?? 0));
      if (media?.kind === "video" && media.el.videoWidth) cover(ctx, media.el, 0, 0, W, H, fx, fy, z, media.el.videoWidth, media.el.videoHeight);
      else if (media?.kind === "image") cover(ctx, media.el, 0, 0, W, H, fx, fy, z);
      else {
        const d = img(DEFAULT_BG[fmt.group]);
        if (d) cover(ctx, d, 0, 0, W, H, fx, fy, z);
      }
      drawShade(ctx, fmt.shade);
      fmt.draw({ ctx, t, f: fonts, img, lang }, vals, data);
    },
    [media, fx, fy, zoom, fmt, fonts, img, lang, vals, data],
  );

  /* Vorschau in Schleife */
  useEffect(() => {
    if (busy !== null) return;
    let raf = 0;
    const loop = () => {
      const cycle = fmt.len + 2;
      const t = ((performance.now() - t0.current) / 1000) % cycle;
      frame(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frame, fmt, busy]);

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
    frame(99);
    canvas.current?.toBlob((b) => b && setResult({ blob: b, name: `${fmt.id}-${stamp()}.png`, url: URL.createObjectURL(b) }), "image/png");
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
          drawShade(ctx, fmt.shade);
          fmt.draw({ ctx, t, f: fonts, img, lang }, vals, data);
        } else frame(t, { kenBurns: 0.06 * (t / duration) });
      };
      const blob = await record({ canvas: c, frame: recFrame, duration, video, cues: fmt.cues(vals), sound, onProgress: (p) => setBusy(Math.round(p * 20) / 20) });
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

  return (
    <div ref={root} className="studio">
      <header className="st-head">
        <h1>Studio</h1>
        {access === "all" && (
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
                {g === "team" ? "Team" : "Pierre"}
              </button>
            ))}
          </div>
        )}
      </header>

      <p className="st-msg">
        {group === "team" ? liveMsg : stravaMsg}
        {group === "pierre" && (
          <button className="st-link" onClick={loadStrava}>
            neu laden
          </button>
        )}
      </p>

      <div className="st-formats">
        {list.map((f) => (
          <button key={f.id} className={f.id === fid ? "on" : ""} onClick={() => pickFormat(f)}>
            {f.name}
          </button>
        ))}
      </div>

      <div className="st-stage">
        <canvas ref={canvas} width={W} height={H} />
        {busy !== null && (
          <div className="st-busy">
            <span>Video wird aufgenommen … {Math.round(busy * 100)} %</span>
            <small>Bildschirm anlassen, App nicht wechseln.</small>
          </div>
        )}
      </div>

      <label className="st-file">
        {media ? (media.kind === "video" ? "Anderes Foto oder Video" : "Anderes Foto oder Video") : "Foto oder Video wählen"}
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

      {fmt.fields.length > 0 && (
        <div className="st-fields">
          {fmt.fields.map((fl) => (
            <label key={fl.key}>
              {fl.label}
              {fl.kind === "runner" ? (
                <select
                  value={vals[fl.key] ?? ""}
                  onChange={(e) => {
                    setEdited(true);
                    const r = team.runners.find((x) => x.last === e.target.value);
                    setVals((v) => ({ ...v, [fl.key]: e.target.value, ...(fl.key === "wer" && "runden" in v && r ? { runden: String(r.laps) } : {}) }));
                  }}
                >
                  {runnerOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.l}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={vals[fl.key] ?? ""}
                  onChange={(e) => {
                    setEdited(true);
                    setVals((v) => ({ ...v, [fl.key]: e.target.value }));
                  }}
                />
              )}
            </label>
          ))}
          {edited && (
            <button className="st-link" onClick={() => setEdited(false)}>
              Zahlen wieder automatisch
            </button>
          )}
        </div>
      )}

      <div className="st-actions">
        {media?.kind !== "video" && (
          <button onClick={savePng} disabled={busy !== null}>
            Bild
          </button>
        )}
        <button className="primary" onClick={saveVideo} disabled={busy !== null}>
          {media?.kind === "video" ? "Video mit Grafik" : "Animiertes Video"}
        </button>
        <button onClick={() => (t0.current = performance.now())}>Nochmal abspielen</button>
      </div>
      <label className="st-check">
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Leise Toneffekte im Video
      </label>

      {err && <p className="st-err">{err}</p>}
      {result && (
        <div className="st-result">
          {result.blob.type.startsWith("video") ? <video src={result.url} controls playsInline /> : <img src={result.url} alt="" />}
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

      {group === "pierre" && (
        <label className="st-check">
          <input type="checkbox" checked={stravaTest} onChange={(e) => setStravaTest(e.target.checked)} /> Test mit Trainingslauf vom 12.10.
        </label>
      )}
    </div>
  );
}
