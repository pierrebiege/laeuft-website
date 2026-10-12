/**
 * Vorlagen des Studios: Grafik über Minhs Foto oder Video, 1080×1920.
 *
 * Jede Vorlage zeichnet sich selbst für einen Zeitpunkt t (Sekunden seit
 * Beginn). So entsteht dasselbe Bild für die Vorschau, das PNG (t = Ende)
 * und das Video (t läuft mit). Töne kommen als Cues mit, das Studio
 * spielt sie beim Aufnehmen leise ab.
 *
 * Team: Look Swiss Backyard (Archivo, Rot, Papier).
 * Pierre: Look LSU-Recap (Inter, Strava-Orange, weisse Karten).
 */

export const W = 1080;
export const H = 1920;
export const RED = "#d8000e";
export const PAPER = "#e9e5dd";
export const INK = "#0b0b0b";
export const ORANGE = "#FC4C02";
export const GREY = "#8e8e94";
export const LOOP_KM = 6.706;
export const START_HOUR = 14;
export const RECORD_2024 = 501;

export type Lang = "de" | "en";
export type Shade = "b" | "t" | "tb" | "all" | "none";
export type Cue = { at: number; kind: "pop" | "tick" | "whoosh" | "bell" };

export type TeamRunner = { first: string; last: string; photo?: string; pb: number; laps: number; out: boolean };
export type StravaLap = { lap: number; elapsed: number; distance: number; avgHr: number | null; maxHr: number | null };
export type Data = {
  lang: Lang;
  team: { lap: number; runners: TeamRunner[] };
  pierre: { laps: StravaLap[]; kcal: number | null; latlng: [number, number][]; hr: number[]; temp: number | null; rrLaps: number };
};
export type Vals = Record<string, string>;
export type Fonts = { inter: string; archivo: string; mono: string };
export type Env = {
  ctx: CanvasRenderingContext2D;
  t: number;
  f: Fonts;
  img: (src: string) => HTMLImageElement | null;
  lang: Lang;
};
export type Field = { key: string; label: string; kind?: "runner" | "text" };
export type Format = {
  id: string;
  group: "team" | "pierre";
  name: string;
  shade: Shade;
  /** Länge der Einblend-Animation in Sekunden */
  len: number;
  fields: Field[];
  prefill: (d: Data) => Vals;
  draw: (e: Env, v: Vals, d: Data) => void;
  cues: (v: Vals) => Cue[];
};

/* ---------- Hilfen ---------- */

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const outBack = (x: number) => {
  const c = 1.4;
  const y = clamp(x) - 1;
  return 1 + (c + 1) * y * y * y + c * y * y;
};
/** Fortschritt 0..1 eines Elements, das bei `at` startet und `dur` Sekunden dauert. */
export const ease = (t: number, at: number, dur = 0.6) => outCubic((t - at) / dur);

const th = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "’");
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const hhmm = (h: number) => `${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`;
const kmStr = (laps: number, lang: Lang) => {
  const s = (laps * LOOP_KM).toFixed(1);
  return lang === "de" ? s.replace(".", ",") : s;
};

/**
 * Zahl in einem Text hochzählen: «53:20» als Zeit, «120,7» mit Komma,
 * «7’207» mit Tausender-Apostroph. Alles andere bleibt, wie es ist.
 */
export function countStr(s: string, p: number): string {
  if (p >= 1) return s;
  const time = /^(\d+):(\d{2})$/.exec(s);
  if (time) return mmss((Number(time[1]) * 60 + Number(time[2])) * p);
  const num = /^([\d’']+)([.,]\d+)?$/.exec(s);
  if (num) {
    const dec = num[2] ? num[2].length - 1 : 0;
    const v = Number(num[1].replace(/[’']/g, "") + (num[2] ? "." + num[2].slice(1) : "")) * p;
    let out = dec ? v.toFixed(dec) : th(v);
    if (dec) out = out.replace(".", num[2]![0]);
    if (dec && /[’']/.test(num[1])) out = out.replace(/^\d+/, (m) => th(Number(m)));
    return out;
  }
  const lead = /^(\d+)(.*)$/.exec(s);
  if (lead) return `${Math.round(Number(lead[1]) * p)}${lead[2]}`;
  return s;
}

/** Ticks während des Hochzählens */
const ticks = (at: number, dur: number, n = 10): Cue[] =>
  Array.from({ length: n }, (_, i) => ({ at: at + (i / n) * dur, kind: "tick" as const }));

type TextOpt = { font: string; color?: string; align?: CanvasTextAlign; alpha?: number; base?: CanvasTextBaseline; spacing?: number };
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: TextOpt) {
  ctx.save();
  ctx.font = o.font;
  ctx.fillStyle = o.color ?? "#fff";
  ctx.textAlign = o.align ?? "left";
  ctx.textBaseline = o.base ?? "alphabetic";
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.spacing !== undefined && "letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.spacing}px`;
  ctx.fillText(s, x, y);
  ctx.restore();
}
function measure(ctx: CanvasRenderingContext2D, s: string, font: string, spacing?: number) {
  ctx.save();
  ctx.font = font;
  if (spacing !== undefined && "letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function shadowCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 40;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}
/** Bild randlos in ein Rechteck, Fokus oben-mitte, optional grau */
export function cover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number, fx = 50, fy = 30, zoom = 1, iw?: number, ih?: number) {
  const nw = iw ?? (img as HTMLImageElement).naturalWidth ?? img.width;
  const nh = ih ?? (img as HTMLImageElement).naturalHeight ?? img.height;
  if (!nw || !nh) return;
  const s = Math.max(w / nw, h / nh) * zoom;
  const dw = nw * s;
  const dh = nh * s;
  ctx.drawImage(img, x - (dw - w) * (fx / 100), y - (dh - h) * (fy / 100), dw, dh);
}
function greyOut(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.globalCompositeOperation = "saturation";
  ctx.fillStyle = "#808080";
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}
function portrait(e: Env, photo: string | undefined, x: number, y: number, w: number, h: number, r: number, grey = false) {
  const { ctx } = e;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(x, y, w, h);
  const im = photo ? e.img(`/backyard/squad/${photo}.jpg`) : null;
  if (im) cover(ctx, im, x, y, w, h, 50, 25);
  ctx.restore();
  if (grey) greyOut(ctx, x, y, w, h, r);
}

/** Strecke in ein Rechteck projizieren */
export function projectRoute(ll: [number, number][], w: number, h: number, pad = 10): [number, number][] {
  if (ll.length < 2) return [];
  const lat0 = ll.reduce((s, p) => s + p[0], 0) / ll.length;
  const c = Math.cos((lat0 * Math.PI) / 180);
  const xs = ll.map((p) => p[1] * c);
  const ys = ll.map((p) => -p[0]);
  const [mnx, mxx, mny, mxy] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min((w - 2 * pad) / (mxx - mnx || 1), (h - 2 * pad) / (mxy - mny || 1));
  const ox = (w - (mxx - mnx) * k) / 2;
  const oy = (h - (mxy - mny) * k) / 2;
  return xs.map((x, i) => [ox + (x - mnx) * k, oy + (ys[i] - mny) * k]);
}
function polyline(ctx: CanvasRenderingContext2D, pts: [number, number][], p: number, dx = 0, dy = 0) {
  const n = Math.max(2, Math.floor(pts.length * clamp(p)));
  ctx.beginPath();
  pts.slice(0, n).forEach(([x, y], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy)));
  ctx.stroke();
}

/* ---------- Pierre: eine grosse Zahl ---------- */

const I = (f: Fonts, w: number, s: number) => `${w} ${s}px ${f.inter}`;
const A = (f: Fonts, w: number, s: number) => `${w} ${s}px ${f.archivo}`;
const M = (f: Fonts, s: number) => `500 ${s}px ${f.mono}`;

/** Label oben, Zahl darunter, zentriert (Stil «Runde 17 gefinished in 53:20») */
function bigTop(e: Env, label: string, num: string, sub?: string, size = 300) {
  const { ctx, t, f } = e;
  const a = ease(t, 0.15, 0.5);
  const n = ease(t, 0.3, 1.1);
  text(ctx, label, W / 2, 330 - (1 - a) * 20, { font: I(f, 700, 38), align: "center", alpha: a * 0.9 });
  text(ctx, countStr(num, n), W / 2, 340 + size * 0.86, { font: I(f, 900, size), align: "center", alpha: ease(t, 0.3, 0.3), spacing: -size * 0.06 });
  if (sub) text(ctx, sub, W / 2, 400 + size * 0.86 + 20, { font: I(f, 700, 36), align: "center", alpha: ease(t, 1.3, 0.5) * 0.9 });
}
/** Label, Zahl und Einheit unten links (Stil «Runde 18») */
function bigBottom(e: Env, label: string, num: string, unit = "", size = 330) {
  const { ctx, t, f } = e;
  const a = ease(t, 0.15, 0.5);
  const n = ease(t, 0.3, 1.1);
  const base = H - 300;
  text(ctx, label, 72, base - size * 0.86 - 22 - (1 - a) * 20, { font: I(f, 700, 38), alpha: a * 0.9 });
  const s = countStr(num, n);
  text(ctx, s, 66, base, { font: I(f, 900, size), alpha: ease(t, 0.3, 0.3), spacing: -size * 0.06 });
  if (unit) {
    const w = measure(ctx, num, I(f, 900, size), -size * 0.06);
    text(ctx, unit, 66 + w + 18, base, { font: I(f, 700, 60), alpha: ease(t, 1.2, 0.4) });
  }
}

const lastLap = (d: Data) => d.pierre.laps.at(-1);
const lapNo = (d: Data) => Math.max(d.pierre.laps.length, d.pierre.rrLaps);
const numCues = (): Cue[] => [{ at: 0.15, kind: "whoosh" }, ...ticks(0.3, 1.1, 12), { at: 1.4, kind: "pop" }];

const P: Format[] = [
  {
    id: "p-runde", group: "pierre", name: "Runde", shade: "b", len: 1.6,
    fields: [{ key: "runde", label: "Runde" }],
    prefill: (d) => ({ runde: String(lapNo(d) || 1) }),
    draw: (e, v) => bigBottom(e, "Runde", v.runde, "", 420),
    cues: numCues,
  },
  {
    id: "p-gefinished", group: "pierre", name: "Runde gefinished", shade: "t", len: 1.6,
    fields: [{ key: "runde", label: "Runde" }, { key: "zeit", label: "Zeit (mm:ss)" }],
    prefill: (d) => ({ runde: String(lapNo(d) || 1), zeit: lastLap(d) ? mmss(lastLap(d)!.elapsed) : "53:20" }),
    draw: (e, v) => bigTop(e, `Runde ${v.runde} gefinished in`, v.zeit),
    cues: numCues,
  },
  {
    id: "p-strava", group: "pierre", name: "Strava-Karte", shade: "none", len: 2.2,
    fields: [{ key: "km", label: "km" }, { key: "zeit", label: "Zeit" }, { key: "puls", label: "Puls Ø" }],
    prefill: (d) => {
      const l = lastLap(d);
      return { km: l ? (l.distance / 1000).toFixed(2) : "6.71", zeit: l ? mmss(l.elapsed) : "53:20", puls: String(l?.avgHr ?? "") };
    },
    draw: (e, v, d) => {
      const { ctx, t, f } = e;
      const p = ease(t, 0.1, 0.7);
      const ch = 420;
      const y = H - 280 - ch + (1 - p) * 500;
      ctx.save();
      ctx.globalAlpha = clamp(p * 1.5);
      shadowCard(ctx, 60, y, W - 120, ch, 30, "#fff");
      const pts = projectRoute(d.pierre.latlng, 340, 340, 10);
      if (pts.length) {
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 8;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        polyline(ctx, pts, ease(t, 0.6, 1.4), 100, y + 40);
      }
      const rows: [string, string][] = [[v.km, "km"], [v.zeit, "Zeit"], [v.puls, "Puls Ø"]].filter((r) => r[0]) as [string, string][];
      const x0 = pts.length ? 520 : 120;
      rows.forEach(([val, lab], i) => {
        const q = ease(t, 0.5 + i * 0.2, 0.9);
        const yy = y + 100 + i * 120;
        text(ctx, countStr(val, q), x0, yy, { font: I(f, 800, 80), color: "#0b0b0c", alpha: clamp(q * 2), spacing: -3 });
        text(ctx, lab, x0, yy + 34, { font: I(f, 500, 26), color: GREY, alpha: clamp(q * 2) });
      });
      ctx.restore();
    },
    cues: () => [{ at: 0.1, kind: "whoosh" }, ...ticks(0.5, 1.2, 12), { at: 1.8, kind: "pop" }],
  },
  {
    id: "p-puls", group: "pierre", name: "Pulslinie", shade: "b", len: 2.4,
    fields: [{ key: "bpm", label: "Puls (bpm)" }],
    prefill: (d) => ({ bpm: String(lastLap(d)?.maxHr ?? "") }),
    draw: (e, v, d) => {
      const { ctx, t, f } = e;
      const hr = d.pierre.hr;
      if (hr.length > 20) {
        const a = Math.floor(hr.length * 0.25);
        const seg = hr.slice(a, a + Math.min(160, hr.length - a));
        const lo = Math.min(...seg) - 5;
        const hi = Math.max(...seg) + 5;
        const pts = seg.map((h, i) => [(i / (seg.length - 1)) * W, 1060 - ((h - lo) / (hi - lo)) * 420] as [number, number]);
        ctx.save();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 6;
        ctx.lineJoin = "round";
        polyline(ctx, pts, ease(t, 0, 2.2));
        ctx.restore();
      }
      if (v.bpm) {
        const n = ease(t, 0.4, 1.2);
        const beat = 1 + 0.04 * Math.max(0, Math.sin(t * Math.PI * 2 * 1.6)) * (t > 1.6 ? 1 : 0);
        ctx.save();
        ctx.translate(66, H - 300);
        ctx.scale(beat, beat);
        text(ctx, countStr(v.bpm, n), 0, 0, { font: I(f, 900, 300), alpha: ease(t, 0.4, 0.3), spacing: -18 });
        const w = measure(ctx, v.bpm, I(f, 900, 300), -18);
        text(ctx, "bpm", w + 16, 0, { font: I(f, 700, 56), alpha: ease(t, 1.3, 0.4) });
        ctx.restore();
      }
    },
    cues: () => [...ticks(0.4, 1.2, 12), { at: 1.7, kind: "pop" }, { at: 2.3, kind: "pop" }],
  },
  {
    id: "p-langsam", group: "pierre", name: "Langsamste / schnellste", shade: "t", len: 2,
    fields: [{ key: "art", label: "Langsamste oder Schnellste" }, { key: "zeit", label: "Zeit (mm:ss)" }, { key: "runde", label: "Runde" }],
    prefill: (d) => {
      const laps = d.pierre.laps;
      const slow = laps.reduce<StravaLap | null>((m, l) => (!m || l.elapsed > m.elapsed ? l : m), null);
      return { art: "Langsamste", zeit: slow ? mmss(slow.elapsed) : "58:41", runde: String(slow?.lap ?? 22) };
    },
    draw: (e, v) => {
      const [m, s] = v.zeit.split(":").map(Number);
      const rest = 3600 - (m * 60 + s);
      const sub = rest >= 0 && rest < 600 ? `Runde ${v.runde} · ${rest < 120 ? `${rest} Sekunden` : `${Math.round(rest / 60)} Minuten`} vor der Glocke` : `Runde ${v.runde}`;
      bigTop(e, `${v.art} Runde bisher`, v.zeit, sub);
    },
    cues: () => [...numCues(), { at: 1.3, kind: "pop" }],
  },
  {
    id: "p-stuhl", group: "pierre", name: "Zeit im Stuhl", shade: "b", len: 1.6,
    fields: [{ key: "runde", label: "Vor Runde" }, { key: "zeit", label: "Pause (mm:ss)" }],
    prefill: (d) => {
      const l = lastLap(d);
      return { runde: String(lapNo(d) + 1), zeit: l ? mmss(Math.max(0, 3600 - l.elapsed)) : "6:40" };
    },
    draw: (e, v) => bigBottom(e, `Im Stuhl vor Runde ${v.runde}`, v.zeit, "min"),
    cues: numCues,
  },
  {
    id: "p-uhrzeit", group: "pierre", name: "Uhrzeit", shade: "t", len: 1.6,
    fields: [{ key: "runde", label: "Runde" }, { key: "zeit", label: "Uhrzeit" }],
    prefill: (d) => {
      const r = lapNo(d) + 1;
      return { runde: String(r), zeit: hhmm(START_HOUR + r - 1) };
    },
    draw: (e, v) => bigTop(e, `Runde ${v.runde} startet`, v.zeit),
    cues: () => [{ at: 0.15, kind: "whoosh" }, { at: 0.5, kind: "bell" }],
  },
  {
    id: "p-km", group: "pierre", name: "Kilometer", shade: "b", len: 1.6,
    fields: [{ key: "km", label: "km" }],
    prefill: (d) => ({ km: kmStr(lapNo(d) || 1, "de") }),
    draw: (e, v) => bigBottom(e, "Seit Samstag, 14 Uhr", v.km, "km"),
    cues: numCues,
  },
  {
    id: "p-pulsvs", group: "pierre", name: "Puls Strecke / Stuhl", shade: "b", len: 2,
    fields: [{ key: "strecke", label: "Puls Strecke" }, { key: "stuhl", label: "Puls Stuhl" }],
    prefill: (d) => ({ strecke: String(lastLap(d)?.maxHr ?? ""), stuhl: "" }),
    draw: (e, v) => {
      const { ctx, t, f } = e;
      const rows: [string, string, string][] = [["auf der Strecke", v.strecke, "#fff"], ["im Stuhl", v.stuhl, ORANGE]];
      rows.forEach(([lab, num, col], i) => {
        if (!num) return;
        const base = H - 300 - (1 - i) * 340;
        const q = ease(t, 0.3 + i * 0.5, 1);
        text(ctx, lab, 72, base - 232, { font: I(f, 700, 38), alpha: ease(t, 0.1 + i * 0.5, 0.4) * 0.9 });
        text(ctx, countStr(num, q), 66, base, { font: I(f, 900, 260), color: col, alpha: ease(t, 0.3 + i * 0.5, 0.3), spacing: -15 });
        const w = measure(ctx, num, I(f, 900, 260), -15);
        text(ctx, "bpm", 66 + w + 16, base, { font: I(f, 700, 56), alpha: ease(t, 1 + i * 0.5, 0.4) });
      });
    },
    cues: () => [...ticks(0.3, 1, 8), ...ticks(0.8, 1, 8), { at: 1.8, kind: "pop" }],
  },
  {
    id: "p-kcal", group: "pierre", name: "Kalorien", shade: "b", len: 1.6,
    fields: [{ key: "kcal", label: "kcal" }],
    prefill: (d) => ({ kcal: String(d.pierre.kcal ?? "") }),
    draw: (e, v) => bigBottom(e, "Eine Runde", v.kcal, "kcal"),
    cues: numCues,
  },
  {
    id: "p-temp", group: "pierre", name: "Temperatur", shade: "b", len: 1.6,
    fields: [{ key: "zeit", label: "Uhrzeit" }, { key: "runde", label: "Runde" }, { key: "grad", label: "Grad" }],
    prefill: (d) => {
      const now = new Date();
      return {
        zeit: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        runde: String(lapNo(d) + 1),
        grad: d.pierre.temp === null ? "" : String(Math.round(d.pierre.temp)),
      };
    },
    draw: (e, v) => bigBottom(e, `${v.zeit} · Runde ${v.runde}`, `${v.grad}°`),
    cues: numCues,
  },
  {
    id: "p-nacht", group: "pierre", name: "Nacht überstanden", shade: "t", len: 2,
    fields: [{ key: "nacht", label: "Nacht" }, { key: "label", label: "Zeile oben" }],
    prefill: () => ({ nacht: "1", label: "Sonntag, Sonnenaufgang" }),
    draw: (e, v) => bigTop(e, v.label, `Nacht ${v.nacht}`, "überstanden", 240),
    cues: () => [{ at: 0.15, kind: "whoosh" }, { at: 0.6, kind: "pop" }, { at: 1.3, kind: "pop" }],
  },
  {
    id: "p-letzte", group: "pierre", name: "Letzte Runde", shade: "tb", len: 2,
    fields: [{ key: "runde", label: "Runden" }, { key: "km", label: "km" }, { key: "zeit", label: "Gesamtzeit" }],
    prefill: (d) => {
      const n = lapNo(d) || 1;
      const sec = d.pierre.laps.length ? (n - 1) * 3600 + lastLap(d)!.elapsed : n * 3600;
      return { runde: String(n), km: kmStr(n, "de"), zeit: `${Math.floor(sec / 3600)} h ${Math.floor((sec % 3600) / 60)} min` };
    },
    draw: (e, v) => bigTop(e, "Letzte Runde", v.runde, `${v.km} km · ${v.zeit}`),
    cues: () => [{ at: 0.15, kind: "bell" }, ...ticks(0.3, 1.1, 12), { at: 1.4, kind: "pop" }],
  },
];

/* ---------- Team ---------- */

const L = (lang: Lang, de: string, en: string) => (lang === "de" ? de : en);
const standing = (d: Data) => d.team.runners.filter((r) => !r.out);
const byLaps = (d: Data) => [...d.team.runners].sort((a, b) => b.laps - a.laps || Number(a.out) - Number(b.out));
const findRunner = (d: Data, last: string) => d.team.runners.find((r) => r.last === last) ?? d.team.runners[0];

const T: Format[] = [
  {
    id: "t-liste", group: "team", name: "Alle 15", shade: "all", len: 2.6,
    fields: [{ key: "runde", label: "Runde" }],
    prefill: (d) => ({ runde: String(d.team.lap) }),
    draw: (e, v, d) => {
      const { ctx, t, f, lang } = e;
      const p = ease(t, 0, 0.6);
      const rows = byLaps(d);
      const x = 50;
      const y = 230 + (1 - p) * 80;
      const w = W - 100;
      const h = 150 + rows.length * 58;
      ctx.save();
      ctx.globalAlpha = p;
      shadowCard(ctx, x, y, w, h, 22, PAPER);
      text(ctx, `${L(lang, "Runde", "Loop")} ${v.runde}`, x + 44, y + 104, { font: A(f, 800, 80), color: INK, spacing: -2 });
      const max = Math.max(1, ...rows.map((r) => r.laps));
      rows.forEach((r, i) => {
        const yy = y + 170 + i * 58;
        const q = ease(t, 0.4 + i * 0.07, 0.8);
        const col = r.out ? "rgba(11,11,11,.42)" : INK;
        text(ctx, `${r.first} ${r.last}`, x + 44, yy, { font: A(f, 600, 30), color: col });
        const bx = x + 390;
        const bw = w - 390 - 44 - 80;
        roundRect(ctx, bx, yy - 22, Math.max(4, bw * (r.laps / max) * q), 22, 3);
        ctx.fillStyle = r.out ? "rgba(11,11,11,.22)" : RED;
        ctx.fill();
        text(ctx, String(Math.round(r.laps * q)), x + w - 44, yy, { font: `700 30px ${f.mono}`, color: col, align: "right" });
      });
      ctx.restore();
    },
    cues: () => [{ at: 0, kind: "whoosh" }, ...ticks(0.4, 1.8, 15)],
  },
  {
    id: "t-stehen", group: "team", name: "Wer noch läuft", shade: "b", len: 2.6,
    fields: [{ key: "runde", label: "Runde" }, { key: "noch", label: "Laufen noch" }],
    prefill: (d) => ({ runde: String(d.team.lap), noch: String(standing(d).length) }),
    draw: (e, v, d) => {
      const { ctx, t, f, lang } = e;
      const base = H - 300;
      const cs = 64;
      const gap = 22;
      const n = d.team.runners.length || 15;
      const rowsY = base - 2 * cs - gap;
      d.team.runners
        .slice()
        .sort((a, b) => Number(a.out) - Number(b.out))
        .forEach((r, i) => {
          const cx = 72 + (i % 8) * (cs + gap);
          const cy = rowsY + Math.floor(i / 8) * (cs + gap);
          const q = outBack((t - 0.2 - i * 0.06) / 0.4);
          const fade = r.out ? 1 - 0.78 * ease(t, 1.4, 0.6) : 1;
          if (q <= 0) return;
          ctx.save();
          ctx.translate(cx + cs / 2, cy + cs / 2);
          ctx.scale(q, q);
          ctx.globalAlpha = fade;
          ctx.fillStyle = r.out && t > 1.4 ? "rgba(255,255,255,.9)" : RED;
          ctx.fillRect(-cs / 2, -cs / 2, cs, cs);
          ctx.fillStyle = r.out && t > 1.4 ? "rgba(0,0,0,.35)" : "#fff";
          ctx.fillRect(-5, -19, 10, 38);
          ctx.fillRect(-19, -5, 38, 10);
          ctx.restore();
        });
      const top = rowsY - 70;
      text(ctx, `${L(lang, "laufen noch. Runde", "still going. Loop")} ${v.runde}.`, 72, top, { font: A(f, 700, 48), alpha: ease(t, 1.6, 0.5) });
      const q = ease(t, 0.3, 1.2);
      text(ctx, countStr(v.noch, q), 66, top - 70, { font: A(f, 800, 300), alpha: ease(t, 0.3, 0.3), spacing: -18 });
      const w = measure(ctx, v.noch, A(f, 800, 300), -18);
      text(ctx, `${L(lang, "von", "of")} ${n}`, 66 + w + 20, top - 70, { font: A(f, 800, 90), alpha: ease(t, 1, 0.4), spacing: -2 });
    },
    cues: () => [...ticks(0.2, 0.9, 15).map((c) => ({ ...c, kind: "pop" as const })), { at: 1.4, kind: "whoosh" }],
  },
  {
    id: "t-raus", group: "team", name: "Ausgeschieden", shade: "b", len: 2,
    fields: [{ key: "wer", label: "Läufer", kind: "runner" }, { key: "runden", label: "Runden" }],
    prefill: (d) => {
      const out = byLaps(d).filter((r) => r.out);
      const r = out.at(-1) ?? d.team.runners[0];
      return { wer: r?.last ?? "", runden: String(r?.laps ?? 0) };
    },
    draw: (e, v, d) => {
      const { ctx, t, f, lang } = e;
      const r = findRunner(d, v.wer);
      const n = Number(v.runden) || 0;
      const base = H - 300;
      const stats: [string, string][] = [
        [String(n), L(lang, "Runden", "Loops")],
        [kmStr(n, lang), "km"],
        [`${n} h`, L(lang, "unterwegs", "on course")],
      ];
      let x = 72;
      stats.forEach(([val, lab], i) => {
        const q = ease(t, 0.7 + i * 0.15, 1);
        text(ctx, countStr(val, q), x, base - 40, { font: A(f, 800, 92), alpha: clamp(q * 3), spacing: -3 });
        text(ctx, lab.toUpperCase(), x, base, { font: M(f, 24), alpha: clamp(q * 3) * 0.75, spacing: 2 });
        x += Math.max(measure(ctx, val, A(f, 800, 92), -3), measure(ctx, lab.toUpperCase(), M(f, 24), 2)) + 60;
      });
      const p = ease(t, 0.1, 0.6);
      text(ctx, `${r?.first ?? ""}.`, 66, base - 180 + (1 - p) * 40, { font: A(f, 800, 180), alpha: p, spacing: -6 });
    },
    cues: () => [{ at: 0.1, kind: "whoosh" }, ...ticks(0.7, 1.2, 12), { at: 1.9, kind: "pop" }],
  },
  {
    id: "t-stunde", group: "team", name: "Stundenmarke", shade: "t", len: 2,
    fields: [{ key: "stunden", label: "Stunden" }],
    prefill: (d) => ({ stunden: String(d.team.lap) }),
    draw: (e, v) => {
      const { ctx, t, f, lang } = e;
      const hit = t > 0.3 ? Math.exp(-(t - 0.3) * 5) * Math.sin((t - 0.3) * 40) * 10 : 0;
      ctx.save();
      ctx.translate(W / 2 + hit, 300);
      text(ctx, v.stunden, 0, 310, { font: A(f, 800, 360), align: "center", alpha: ease(t, 0.25, 0.2), spacing: -22 });
      ctx.restore();
      const next = Number(v.stunden) + 1;
      text(ctx, L(lang, `Stunden. Runde ${next} läuft.`, `hours. Loop ${next} is on.`), W / 2, 700, { font: A(f, 700, 48), align: "center", alpha: ease(t, 0.9, 0.5) });
    },
    cues: () => [{ at: 0.3, kind: "bell" }, { at: 0.9, kind: "whoosh" }],
  },
  {
    id: "t-duell", group: "team", name: "Duell", shade: "all", len: 2,
    fields: [{ key: "a", label: "Links", kind: "runner" }, { key: "b", label: "Rechts", kind: "runner" }, { key: "runde", label: "Runde" }],
    prefill: (d) => {
      const s = byLaps(d).filter((r) => !r.out);
      const two = s.length >= 2 ? s : byLaps(d);
      return { a: two[0]?.last ?? "", b: two[1]?.last ?? "", runde: String(d.team.lap + 1) };
    },
    draw: (e, v, d) => {
      const { ctx, t, f, lang } = e;
      const a = findRunner(d, v.a);
      const b = findRunner(d, v.b);
      const pw = 400;
      const ph = 520;
      const y = H - 280 - 120 - ph;
      const pa = ease(t, 0.1, 0.7);
      const pb = ease(t, 0.35, 0.7);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.5)";
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 30;
      portrait(e, a?.photo, 70 - (1 - pa) * 600, y, pw, ph, 22);
      portrait(e, b?.photo, W - 70 - pw + (1 - pb) * 600, y, pw, ph, 22);
      ctx.restore();
      text(ctx, a?.first ?? "", 70 + pw / 2 - (1 - pa) * 600, y + ph + 76, { font: A(f, 800, 62), align: "center" });
      text(ctx, b?.first ?? "", W - 70 - pw / 2 + (1 - pb) * 600, y + ph + 76, { font: A(f, 800, 62), align: "center" });
      text(ctx, L(lang, `Zwei übrig. Runde ${v.runde}.`, `Two left. Loop ${v.runde}.`), W / 2, H - 230, { font: A(f, 700, 48), align: "center", alpha: ease(t, 1.1, 0.5) });
    },
    cues: () => [{ at: 0.1, kind: "whoosh" }, { at: 0.35, kind: "whoosh" }, { at: 1.1, kind: "pop" }],
  },
  {
    id: "t-bestmarke", group: "team", name: "Bestmarke", shade: "b", len: 2.4,
    fields: [{ key: "wer", label: "Läufer", kind: "runner" }, { key: "runde", label: "Runde" }],
    prefill: (d) => {
      // wer seine Bestmarke am weitesten übertrifft, sonst wer am nächsten dran ist
      const r = [...d.team.runners].sort((a, b) => b.laps - b.pb - (a.laps - a.pb))[0];
      return { wer: r?.last ?? "", runde: String(r?.laps ?? 0) };
    },
    draw: (e, v, d) => {
      const { ctx, t, f, lang } = e;
      const r = findRunner(d, v.wer);
      const n = Number(v.runde) || 0;
      const pb = r?.pb ?? 0;
      const diff = n - pb;
      const sub =
        diff <= 0
          ? L(lang, "Bestmarke eingestellt.", "Personal best equalled.")
          : diff === 1
            ? L(lang, "Eine mehr als je zuvor.", "One more than ever before.")
            : L(lang, `${diff} mehr als je zuvor.`, `${diff} more than ever before.`);
      const p = ease(t, 0.1, 0.6);
      const ch = 330;
      const y = H - 270 - ch + (1 - p) * 300;
      ctx.save();
      ctx.globalAlpha = clamp(p * 1.5);
      shadowCard(ctx, 50, y, W - 100, ch, 22, PAPER);
      text(ctx, `${r?.first ?? ""}, ${L(lang, "Runde", "loop")} ${n}.`, 94, y + 104, { font: A(f, 800, 76), color: INK, spacing: -2 });
      text(ctx, sub, 94, y + 162, { font: A(f, 500, 40), color: "rgba(11,11,11,.6)", alpha: ease(t, 1.7, 0.4) });
      const bx = 94;
      const bw = W - 188;
      const by = y + 210;
      const scale = Math.max(n, pb) + 2;
      roundRect(ctx, bx, by, bw, 28, 4);
      ctx.fillStyle = "rgba(11,11,11,.12)";
      ctx.fill();
      const q = ease(t, 0.5, 1.4);
      roundRect(ctx, bx, by, Math.max(6, (bw * n * q) / scale), 28, 4);
      ctx.fillStyle = RED;
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillRect(bx + (bw * pb) / scale - 2, by - 14, 5, 56);
      text(ctx, L(lang, "Runde 1", "Loop 1"), bx, by + 70, { font: M(f, 24), color: "rgba(11,11,11,.6)" });
      text(ctx, `${L(lang, "Bestmarke", "Best")} ${pb}`, bx + (bw * pb) / scale, by + 70, { font: M(f, 24), color: "rgba(11,11,11,.6)", align: "center" });
      ctx.restore();
    },
    cues: () => [{ at: 0.1, kind: "whoosh" }, ...ticks(0.5, 1.2, 10), { at: 1.7, kind: "pop" }],
  },
  {
    id: "t-live", group: "team", name: "Live-Bauchbinde", shade: "none", len: 1.4,
    fields: [{ key: "runde", label: "Runde" }, { key: "zeile", label: "Zweite Zeile" }],
    prefill: (d) => {
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      return {
        runde: String(d.team.lap + 1),
        zeile: L(d.lang, `${standing(d).length} von ${d.team.runners.length} im Rennen · ${hm}`, `${standing(d).length} of ${d.team.runners.length} still in · ${hm}`),
      };
    },
    draw: (e, v) => {
      const { ctx, t, f, lang } = e;
      const y = H - 300 - 150;
      const p = ease(t, 0.1, 0.5);
      const q = ease(t, 0.35, 0.6);
      const lw = 170;
      ctx.save();
      ctx.fillStyle = RED;
      ctx.fillRect(50 - (1 - p) * 300, y, lw, 150);
      text(ctx, "LIVE", 50 + lw / 2 - (1 - p) * 300, y + 92, { font: A(f, 800, 44), align: "center" });
      ctx.beginPath();
      ctx.rect(50 + lw, y, W - 100 - lw, 150);
      ctx.clip();
      ctx.fillStyle = "#fff";
      ctx.fillRect(50 + lw - (1 - q) * (W - 100 - lw), y, W - 100 - lw, 150);
      text(ctx, `${L(lang, "Runde", "Loop")} ${v.runde}`, 50 + lw + 34, y + 70, { font: A(f, 800, 56), color: INK, alpha: ease(t, 0.7, 0.3) });
      text(ctx, v.zeile, 50 + lw + 34, y + 116, { font: M(f, 27), color: "rgba(11,11,11,.6)", alpha: ease(t, 0.85, 0.3) });
      ctx.restore();
    },
    cues: () => [{ at: 0.1, kind: "whoosh" }, { at: 0.7, kind: "pop" }],
  },
  {
    id: "t-summe", group: "team", name: "Teamrunden", shade: "b", len: 2.4,
    fields: [{ key: "summe", label: "Teamrunden" }, { key: "stunden", label: "Nach Stunden" }],
    prefill: (d) => ({ summe: String(d.team.runners.reduce((s, r) => s + r.laps, 0)), stunden: String(d.team.lap) }),
    draw: (e, v) => {
      const { ctx, t, f, lang } = e;
      const n = Number(v.summe) || 0;
      const base = H - 300;
      const bw = W - 144;
      const q = ease(t, 0.3, 1.6);
      roundRect(ctx, 72, base - 80, bw, 28, 4);
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fill();
      const scale = Math.max(n, RECORD_2024) * 1.04;
      roundRect(ctx, 72, base - 80, Math.max(6, (bw * n * q) / scale), 28, 4);
      ctx.fillStyle = RED;
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(72 + (bw * RECORD_2024) / scale - 2, base - 94, 5, 56);
      text(ctx, "0", 72, base - 10, { font: M(f, 24), alpha: 0.8 });
      text(ctx, `2024: ${RECORD_2024}`, 72 + (bw * RECORD_2024) / scale, base - 10, { font: M(f, 24), alpha: 0.8, align: "right" });
      text(ctx, L(lang, `Teamrunden nach ${v.stunden} Stunden`, `team loops after ${v.stunden} hours`), 72, base - 140, { font: A(f, 700, 48), alpha: ease(t, 0.2, 0.5) });
      text(ctx, countStr(v.summe, q), 66, base - 210, { font: A(f, 800, 300), alpha: ease(t, 0.3, 0.3), spacing: -18 });
    },
    cues: () => [...ticks(0.3, 1.6, 16), { at: 2, kind: "pop" }],
  },
  {
    id: "t-gitter", group: "team", name: "Porträt-Gitter", shade: "all", len: 2.6,
    fields: [{ key: "runde", label: "Runde" }],
    prefill: (d) => ({ runde: String(d.team.lap) }),
    draw: (e, v, d) => {
      const { ctx, t, f, lang } = e;
      const cols = 5;
      const gap = 18;
      const cw = (W - 100 - gap * (cols - 1)) / cols;
      const rows = byLaps(d);
      rows.forEach((r, i) => {
        const x = 50 + (i % cols) * (cw + gap);
        const y = 300 + Math.floor(i / cols) * (cw * 1.25 + gap);
        const q = ease(t, 0.1 + i * 0.06, 0.4);
        if (q <= 0) return;
        ctx.save();
        ctx.globalAlpha = q;
        portrait(e, r.photo, x, y + (1 - q) * 30, cw, cw * 1.25, 16, r.out && t > 1.3);
        ctx.restore();
      });
      const n = standing(d).length;
      text(ctx, L(lang, `${n} laufen. Runde ${v.runde}.`, `${n} still going. Loop ${v.runde}.`), 72, H - 300, { font: A(f, 800, 64), alpha: ease(t, 1.5, 0.5), spacing: -1 });
    },
    cues: () => [...ticks(0.1, 0.9, 15).map((c) => ({ ...c, kind: "pop" as const })), { at: 1.3, kind: "whoosh" }],
  },
  {
    id: "t-treppe", group: "team", name: "Top 5", shade: "all", len: 2.2,
    fields: [],
    prefill: () => ({}),
    draw: (e, _v, d) => {
      const { ctx, t, f } = e;
      const top = byLaps(d).slice(0, 5);
      const max = Math.max(1, ...top.map((r) => r.laps));
      const gap = 16;
      const bw = (W - 120 - gap * 4) / 5;
      const base = H - 280;
      top.forEach((r, i) => {
        const q = ease(t, 0.2 + i * 0.12, 1);
        const h = (r.laps / max) * 900 * q;
        const x = 60 + i * (bw + gap);
        ctx.save();
        roundRect(ctx, x, base - h, bw, h + 12, 12);
        ctx.fillStyle = i === 0 ? RED : "#fff";
        ctx.fill();
        ctx.restore();
        const col = i === 0 ? "#fff" : INK;
        if (h > 140) {
          text(ctx, String(Math.round(r.laps * q)), x + 18, base - h + 80, { font: A(f, 800, 70), color: col, spacing: -2 });
          text(ctx, r.first, x + 18, base - 24, { font: A(f, 700, 30), color: col });
        }
      });
    },
    cues: () => [...ticks(0.2, 1.4, 12), { at: 1.6, kind: "pop" }],
  },
];

export const FORMATS: Format[] = [...T, ...P];

/** Verlauf über dem Foto, damit die weisse Schrift trägt */
export function drawShade(ctx: CanvasRenderingContext2D, s: Shade) {
  if (s === "none") return;
  if (s === "all") {
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (s === "b") {
    g.addColorStop(0.4, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.72)");
  } else if (s === "t") {
    g.addColorStop(0, "rgba(0,0,0,.65)");
    g.addColorStop(0.55, "rgba(0,0,0,0)");
  } else {
    g.addColorStop(0, "rgba(0,0,0,.55)");
    g.addColorStop(0.35, "rgba(0,0,0,0)");
    g.addColorStop(0.6, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.72)");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
