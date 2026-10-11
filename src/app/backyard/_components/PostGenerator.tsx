"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, GEN_LIBRARY, GEN_PHOTOS, LOOP_M, PHOTO_BASE, TEAM, TEAM_PHOTOS } from "@/app/backyard/_data/event";

/**
 * Post-Generator fürs Rennwochenende. Wer den Kanal übernimmt, wählt eine
 * Vorlage, die Zahlen kommen aus /live, das Foto aus der Bibliothek oder
 * frisch vom Handy, und am Ende steht ein JPG im Instagram-Stil der
 * Teamvorstellung: Foto vollflächig, schwarzer Verlauf unten, weisse Schrift.
 *
 * Alles passiert im Browser. Hochgeladene Fotos verlassen das Gerät nicht.
 */

type Lang = "de" | "en";
type Tpl = "out" | "stand" | "mark" | "start" | "end" | "free";
type Mark = "night" | "100" | "day" | "200";
type Layout = "photo" | "card" | "red";
type Format = "34" | "45" | "916";

const SIZES: Record<Format, [number, number, string]> = {
  "34": [1080, 1440, "3:4 Feed"],
  "45": [1080, 1350, "4:5 Feed"],
  "916": [1080, 1920, "9:16 Story"],
};

const RED = "#d8000e";
const PAPER = "#e9e5dd";
const INK = "#0b0b0b";
const PAD = 88;

type Live = { laps: number; standing: number; currentLap: number; runners: { last: string; first: string; laps: number }[] };

const km = (laps: number, lang: Lang) => {
  const v = ((laps * LOOP_M) / 1000).toFixed(1);
  return lang === "de" ? v.replace(".", ",") : v;
};

function texts(tpl: Tpl, mark: Mark, lang: Lang, v: { first: string; laps: number; lap: number; standing: number; total: number }) {
  const de = lang === "de";
  switch (tpl) {
    case "out":
      return de
        ? [`${v.first}: ${v.laps} Runden.`, `${km(v.laps, lang)} Kilometer für die Schweiz.`]
        : [`${v.first}: ${v.laps} loops.`, `${km(v.laps, lang)} km for Switzerland.`];
    case "stand":
      return de
        ? [`Runde ${v.lap}.`, `${v.standing} von 15 noch im Rennen. ${v.total} Runden für die Schweiz.`]
        : [`Loop ${v.lap}.`, `${v.standing} of 15 still going. ${v.total} loops for Switzerland.`];
    case "mark":
      if (mark === "night")
        return de
          ? ["Jetzt kommt die Nacht.", `Sonnenuntergang in Baar, Runde 5. ${v.standing} von 15 laufen.`]
          : ["Here comes the night.", `Sunset in Baar, loop 5. ${v.standing} of 15 running.`];
      if (mark === "day")
        return de
          ? ["Der Morgen ist da.", `Sonnenaufgang nach 13 Stunden Dunkelheit. ${v.standing} von 15 laufen noch.`]
          : ["Morning is here.", `Sunrise after 13 hours of darkness. ${v.standing} of 15 still running.`];
      if (mark === "200")
        return de
          ? ["200 Meilen.", `Runde 48 ist durch. ${v.standing} von 15 laufen weiter.`]
          : ["200 miles.", `Loop 48 done. ${v.standing} of 15 keep going.`];
      return de
        ? ["100 Meilen.", `Runde 24 ist durch. ${v.standing} von 15 laufen weiter.`]
        : ["100 miles.", `Loop 24 done. ${v.standing} of 15 keep going.`];
    case "start":
      return de
        ? ["Die erste Glocke.", "14 Uhr in Baar. 15 Läuferinnen und Läufer, eine Runde pro Stunde, so lange es geht."]
        : ["The first bell.", "2 pm in Baar. 15 runners, one loop every hour, for as long as it takes."];
    case "end":
      return de
        ? [`${v.total} Runden.`, "So viele hat das Team Schweiz in Baar gesammelt."]
        : [`${v.total} loops.`, "That is Team Switzerland's total in Baar."];
    default:
      return ["", ""];
  }
}

/** Zeilen umbrechen, damit der Text in `max` Pixel passt. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > max && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, fx: number, fy: number, zoom: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, x - (dw - w) * (fx / 100), y - (dh - h) * (fy / 100), dw, dh);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type Draw = {
  W: number; H: number; layout: Layout; img: HTMLImageElement | null;
  fx: number; fy: number; zoom: number; head: string; sub: string; fam: string;
};

function draw(ctx: CanvasRenderingContext2D, d: Draw) {
  const { W, H, layout, img, fam } = d;
  const light = layout === "card";
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = layout === "red" ? RED : layout === "card" ? PAPER : "#111";
  ctx.fillRect(0, 0, W, H);

  if (img && layout === "photo") {
    drawCover(ctx, img, 0, 0, W, H, d.fx, d.fy, d.zoom);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.35, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.72)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (img && layout === "card") {
    const cw = W - 2 * PAD;
    const ch = Math.round(H * 0.48);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 24;
    roundRect(ctx, PAD, PAD, cw, ch, 22);
    ctx.fillStyle = "#ccc";
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, PAD, PAD, cw, ch, 22);
    ctx.clip();
    drawCover(ctx, img, PAD, PAD, cw, ch, d.fx, d.fy, d.zoom);
    ctx.restore();
  }

  const fg = light ? INK : "#fff";
  const maxW = W - 2 * PAD;

  // Fusszeile: Kreuz + «Swiss Backyard»
  const fy = H - 64 - 30;
  ctx.fillStyle = layout === "red" ? "#fff" : RED;
  ctx.fillRect(PAD, fy, 30, 30);
  ctx.fillStyle = layout === "red" ? RED : "#fff";
  ctx.fillRect(PAD + 12.5, fy + 6, 5, 18);
  ctx.fillRect(PAD + 6, fy + 12.5, 18, 5);
  ctx.fillStyle = fg;
  ctx.font = `700 26px ${fam}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Swiss Backyard", PAD + 44, fy + 16);

  // Text von unten nach oben setzen
  ctx.textBaseline = "alphabetic";
  let y = fy - 80;
  if (d.sub.trim()) {
    ctx.font = `500 40px ${fam}`;
    const lines = wrap(ctx, d.sub, maxW);
    ctx.fillStyle = light ? "rgba(11,11,11,.72)" : "rgba(255,255,255,.92)";
    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.fillText(lines[i], PAD, y);
      y -= 54;
    }
    y -= 26;
  }
  if (d.head.trim()) {
    const n = d.head.length;
    const size = n <= 12 ? 124 : n <= 40 ? 100 : 80;
    ctx.font = `800 ${size}px ${fam}`;
    ctx.fillStyle = fg;
    const lines = wrap(ctx, d.head, maxW);
    const lh = size * 1.02;
    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.save();
      // Archivo-Laufweite der Website: -0.03em
      if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-0.03 * size}px`;
      ctx.fillText(lines[i], PAD, y);
      ctx.restore();
      y -= lh;
    }
  }
}

const TPLS: [Tpl, string][] = [
  ["out", "Ausgeschieden"],
  ["stand", "Zwischenstand"],
  ["mark", "Meilenstein"],
  ["start", "Start"],
  ["end", "Schluss"],
  ["free", "Freier Text"],
];

const MARKS: [Mark, string][] = [
  ["night", "Sonnenuntergang"],
  ["100", "100 Meilen (24)"],
  ["day", "Sonnenaufgang"],
  ["200", "200 Meilen (48)"],
];

type Photo = { label: string; src: string };

function library(): Photo[] {
  const list: Photo[] = [
    { label: "Team", src: `${TEAM_PHOTOS}/squad-together.jpg` },
    { label: "Team auf der Runde", src: `${TEAM_PHOTOS}/on-the-loop.jpg` },
    { label: "X-Bionic-Tag", src: `${TEAM_PHOTOS}/x-bionic-day.jpg` },
    { label: "Nacht", src: `${GEN_PHOTOS}/nacht-1.jpg` },
  ];
  for (const a of TEAM) {
    if (!a.photo) continue;
    const n = GEN_LIBRARY[a.photo] ?? 0;
    for (let i = 1; i <= n; i++) list.push({ label: `${a.first} ${i}`, src: `${GEN_PHOTOS}/${a.photo}-${i}.jpg` });
    list.push({ label: `${a.first} Porträt`, src: `${PHOTO_BASE}/${a.photo}.jpg` });
  }
  return list;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

export default function PostGenerator() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [lang, setLang] = useState<Lang>("de");
  const [tpl, setTpl] = useState<Tpl>("out");
  const [mark, setMark] = useState<Mark>("100");
  const [layout, setLayout] = useState<Layout>("photo");
  const [format, setFormat] = useState<Format>("45");
  const [who, setWho] = useState(TEAM[0].name);
  const [laps, setLaps] = useState(0);
  const [lap, setLap] = useState(0);
  const [standing, setStanding] = useState(15);
  const [total, setTotal] = useState(0);
  const [head, setHead] = useState("");
  const [sub, setSub] = useState("");
  const [edited, setEdited] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [fx, setFx] = useState(50);
  const [fy, setFy] = useState(40);
  const [zoom, setZoom] = useState(1);
  const [fam, setFam] = useState("Archivo, sans-serif");
  const [live, setLive] = useState<Live | null>(null);
  const [liveMsg, setLiveMsg] = useState("Lade Live-Daten …");
  const [test, setTest] = useState(false);
  const photos = useMemo(library, []);
  const athlete = TEAM.find((a) => a.name === who) ?? TEAM[0];

  // Schrift der Website verwenden (next/font vergibt einen eigenen Familiennamen)
  useEffect(() => {
    // Die Variable hängt am Layout-Wrapper, nicht an <html>: am Canvas selbst lesen
    const el = canvas.current ?? document.body;
    const v = getComputedStyle(el).getPropertyValue("--font-archivo").trim();
    const f = v || "Archivo, sans-serif";
    Promise.all([document.fonts.load(`800 100px ${f}`), document.fonts.load(`500 40px ${f}`), document.fonts.load(`700 26px ${f}`)])
      .catch(() => null)
      .then(() => setFam(f));
  }, []);

  // Live-Daten alle 30 s
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE}/live${test ? "?year=2024" : ""}`, { cache: "no-store" });
        const j = await r.json();
        if (stop) return;
        if (!r.ok || !Array.isArray(j.runners)) {
          setLive(null);
          setLiveMsg("Noch keine Live-Daten. Zahlen von Hand eintragen.");
          return;
        }
        setLive(j);
        setLiveMsg(`Live${test ? " (Test mit 2024)" : ""}: Runde ${j.currentLap}, ${j.standing} im Rennen, ${j.laps} Runden total.`);
      } catch {
        if (!stop) setLiveMsg("Live-Daten nicht erreichbar. Zahlen von Hand eintragen.");
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [test]);

  // Live-Zahlen in die Felder übernehmen
  useEffect(() => {
    if (!live) return;
    setLap(live.currentLap);
    setStanding(live.standing);
    setTotal(live.laps);
    const r = live.runners.find((x) => norm(x.last) === norm(athlete.name));
    if (r) setLaps(r.laps);
  }, [live, athlete.name]);

  // Texte aus der Vorlage, solange niemand von Hand geändert hat
  useEffect(() => {
    if (edited) return;
    const [h, s] = texts(tpl, mark, lang, { first: athlete.first, laps, lap, standing, total });
    setHead(h);
    setSub(s);
  }, [tpl, mark, lang, athlete.first, laps, lap, standing, total, edited]);

  // Foto laden
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);

  /** Läufer wechseln: sein erstes Bibliotheksfoto vorschlagen, ausser es liegt ein eigenes Foto drin. */
  const pickRunner = (name: string) => {
    setWho(name);
    const a = TEAM.find((x) => x.name === name);
    if (!a?.photo || src?.startsWith("blob:")) return;
    setSrc(GEN_LIBRARY[a.photo] ? `${GEN_PHOTOS}/${a.photo}-1.jpg` : `${PHOTO_BASE}/${a.photo}.jpg`);
    setFx(50); setFy(40); setZoom(1);
    if (layout === "red") setLayout("photo");
  };

  const [W, H] = SIZES[format];

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    if (ctx) draw(ctx, { W, H, layout: img ? layout : layout === "photo" ? "red" : layout, img, fx, fy, zoom, head, sub, fam });
  }, [W, H, layout, img, fx, fy, zoom, head, sub, fam]);

  const save = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    c.toBlob(
      async (blob) => {
        if (!blob) return;
        const name = `swiss-backyard-${tpl}-${new Date().toISOString().slice(11, 16).replace(":", "")}.jpg`;
        const file = new File([blob], name, { type: "image/jpeg" });
        const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
        if (nav.canShare?.({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
          try {
            await navigator.share({ files: [file] });
            return;
          } catch {
            /* abgebrochen: normaler Download */
          }
        }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      },
      "image/jpeg",
      0.92,
    );
  }, [tpl]);

  const field = "w-full border px-3 py-2 text-[15px] rule bg-transparent";
  const chip = (on: boolean) =>
    `border px-3 py-1.5 text-[13px] rule ${on ? "font-semibold" : ""}`;
  const chipStyle = (on: boolean) => (on ? { background: "var(--byd-fg)", color: "var(--byd-bg)" } : {});

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)]">
      <div className="order-2 space-y-6 lg:order-1">
        <p className="text-[13px]" style={{ color: "var(--byd-mute)" }}>
          {liveMsg}{" "}
          <label className="ml-2 inline-flex items-center gap-1">
            <input type="checkbox" checked={test} onChange={(e) => setTest(e.target.checked)} /> mit 2024 testen
          </label>
        </p>

        <div>
          <p className="stamp mb-2">Vorlage</p>
          <div className="flex flex-wrap gap-2">
            {TPLS.map(([k, l]) => (
              <button key={k} className={chip(tpl === k)} style={chipStyle(tpl === k)} onClick={() => { setTpl(k); setEdited(false); }}>
                {l}
              </button>
            ))}
          </div>
          {tpl === "mark" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {MARKS.map(([k, l]) => (
                <button key={k} className={chip(mark === k)} style={chipStyle(mark === k)} onClick={() => { setMark(k); setEdited(false); }}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tpl === "out" && (
            <label className="col-span-2 text-[13px]">
              Läufer
              <select className={field} value={who} onChange={(e) => { pickRunner(e.target.value); setEdited(false); }}>
                {TEAM.map((a) => (
                  <option key={a.name} value={a.name}>{a.first} {a.name}</option>
                ))}
              </select>
            </label>
          )}
          {tpl === "out" && (
            <label className="text-[13px]">
              Runden
              <input className={field} type="number" inputMode="numeric" value={laps} onChange={(e) => { setLaps(+e.target.value); setEdited(false); }} />
            </label>
          )}
          {(tpl === "stand" || tpl === "mark") && (
            <label className="text-[13px]">
              Runde
              <input className={field} type="number" inputMode="numeric" value={lap} onChange={(e) => { setLap(+e.target.value); setEdited(false); }} />
            </label>
          )}
          {(tpl === "stand" || tpl === "mark") && (
            <label className="text-[13px]">
              Noch im Rennen
              <input className={field} type="number" inputMode="numeric" value={standing} onChange={(e) => { setStanding(+e.target.value); setEdited(false); }} />
            </label>
          )}
          {(tpl === "stand" || tpl === "end") && (
            <label className="text-[13px]">
              Runden total
              <input className={field} type="number" inputMode="numeric" value={total} onChange={(e) => { setTotal(+e.target.value); setEdited(false); }} />
            </label>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-[13px]">
            Titel
            <textarea className={field} rows={2} value={head} onChange={(e) => { setHead(e.target.value); setEdited(true); }} />
          </label>
          <label className="block text-[13px]">
            Text
            <textarea className={field} rows={3} value={sub} onChange={(e) => { setSub(e.target.value); setEdited(true); }} />
          </label>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <button className={chip(lang === "de")} style={chipStyle(lang === "de")} onClick={() => { setLang("de"); setEdited(false); }}>Deutsch</button>
            <button className={chip(lang === "en")} style={chipStyle(lang === "en")} onClick={() => { setLang("en"); setEdited(false); }}>English</button>
            {edited && (
              <button className="underline" onClick={() => setEdited(false)}>Text zurücksetzen</button>
            )}
          </div>
        </div>

        <div>
          <p className="stamp mb-2">Foto</p>
          <label className={`${chip(false)} inline-block cursor-pointer`}>
            Foto vom Handy wählen
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setSrc(URL.createObjectURL(f)); setFx(50); setFy(40); setZoom(1); if (layout === "red") setLayout("photo"); }
              }}
            />
          </label>
          <button className={`${chip(!src)} ml-2`} style={chipStyle(!src)} onClick={() => setSrc(null)}>Ohne Foto</button>
          <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-8">
            {photos.map((p) => (
              <button
                key={p.src}
                title={p.label}
                onClick={() => { setSrc(p.src); setFx(50); setFy(40); setZoom(1); if (layout === "red") setLayout("photo"); }}
                className="aspect-[3/4] overflow-hidden border rule"
                style={src === p.src ? { outline: "3px solid var(--byd-accent)", outlineOffset: 1 } : {}}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.label} loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          {img && (
            <div className="mt-4 grid grid-cols-3 gap-3 text-[13px]">
              <label>Links/rechts<input type="range" min={0} max={100} value={fx} onChange={(e) => setFx(+e.target.value)} className="w-full" /></label>
              <label>Oben/unten<input type="range" min={0} max={100} value={fy} onChange={(e) => setFy(+e.target.value)} className="w-full" /></label>
              <label>Zoom<input type="range" min={100} max={250} value={zoom * 100} onChange={(e) => setZoom(+e.target.value / 100)} className="w-full" /></label>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <p className="stamp mb-2">Gestaltung</p>
            <div className="flex gap-2">
              {([["photo", "Foto gross"], ["card", "Foto als Karte"], ["red", "Rot"]] as [Layout, string][]).map(([k, l]) => (
                <button key={k} className={chip(layout === k)} style={chipStyle(layout === k)} onClick={() => setLayout(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="stamp mb-2">Format</p>
            <div className="flex gap-2">
              {(Object.keys(SIZES) as Format[]).map((k) => (
                <button key={k} className={chip(format === k)} style={chipStyle(format === k)} onClick={() => setFormat(k)}>{SIZES[k][2]}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="order-1 lg:order-2">
        <div className="lg:sticky lg:top-24">
          <canvas ref={canvas} className="block w-full border rule" style={{ aspectRatio: `${W} / ${H}` }} />
          <button
            onClick={save}
            className="mt-4 w-full border px-4 py-3 text-[15px] font-semibold rule"
            style={{ background: "var(--byd-fg)", color: "var(--byd-bg)" }}
          >
            JPG speichern
          </button>
          <p className="mt-2 text-[12px]" style={{ color: "var(--byd-mute)" }}>
            {W} × {H} px. Auf dem Handy öffnet sich «Teilen», dort «Bild sichern».
          </p>
        </div>
      </div>
    </div>
  );
}
