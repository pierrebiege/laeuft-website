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
/** Instagram: oben 250 px, unten 330 px frei (Antwortleiste). Nichts unter dieser Linie. */
export const SAFE_T = 250;
export const SAFE_B = H - 330;
export const RECORD_2024 = 501;

import type { LapRow, LogConfig } from "@/app/backyard/_lib/studio-log";

export type Lang = "de" | "en";
export type Shade = "b" | "t" | "tb" | "m" | "all" | "none";
export type Cue = { at: number; kind: "pop" | "tick" | "whoosh" | "bell" };

export type TeamRunner = { first: string; last: string; photo?: string; pb: number; laps: number; out: boolean };
export type StravaLap = { lap: number; start: string; elapsed: number; distance: number; avgHr: number | null; maxHr: number | null; kcal?: number | null };
export type Data = {
  lang: Lang;
  team: { lap: number; runners: TeamRunner[] };
  pierre: {
    laps: StravaLap[];
    kcal: number | null;
    latlng: [number, number][];
    hr: number[];
    temp: number | null;
    rrLaps: number;
    /** Runden-Log bis und mit der gewählten Runde */
    log: LapRow[];
    /** gewählte Runde (Standard: die letzte fertige) */
    sel: number;
    config: LogConfig;
    /** Für wen die Läufer-Vorlagen gerade laufen */
    who: Who;
  };
};
/**
 * Gewählte Person im Läufer-Reiter. `full`: Pierre mit Vollzugang, also mit
 * Handlog, Strava und Wetter. Alle anderen nur mit race|result.
 */
export type Who = {
  slug: string;
  first: string;
  last: string;
  full: boolean;
  pb: number;
  laps: number;
  status: "in" | "out" | "winner";
  rank: number;
  of: number;
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
/** Schalter und Auswahlen einer Vorlage. Bleiben pro Vorlage gespeichert. */
export type Opt = { key: string; label: string; choices?: [string, string][]; def: string; when?: (o: Vals) => boolean };
export type Format = {
  id: string;
  group: "team" | "pierre";
  name: string;
  shade: Shade;
  /** Verlauf je nach Optionen (Position, Stärke). Fehlt es, gilt `shade`. */
  shadeFor?: (o: Vals) => [Shade, number];
  /** Länge der Einblend-Animation in Sekunden */
  len: number;
  fields: Field[] | ((o: Vals) => Field[]);
  opts?: Opt[];
  prefill: (d: Data, o: Vals) => Vals;
  draw: (e: Env, v: Vals, d: Data, o: Vals) => void;
  cues: (v: Vals, o: Vals) => Cue[];
  /** Läufer-Vorlage, die mit race|result allein auskommt (für alle Läufer) */
  rr?: boolean;
};

/* ---------- Hilfen ---------- */

export const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const outBack = (x: number) => {
  const c = 1.4;
  const y = clamp(x) - 1;
  return 1 + (c + 1) * y * y * y + c * y * y;
};
/** Fortschritt 0..1 eines Elements, das bei `at` startet und `dur` Sekunden dauert. */
export const ease = (t: number, at: number, dur = 0.6) => outCubic((t - at) / dur);

const th = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "’");
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
export const hhmm = (h: number) => `${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`;
export const kmStr = (laps: number, lang: Lang) => {
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
export const ticks = (at: number, dur: number, n = 10): Cue[] =>
  Array.from({ length: n }, (_, i) => ({ at: at + (i / n) * dur, kind: "tick" as const }));

type TextOpt = { font: string; color?: string; align?: CanvasTextAlign; alpha?: number; base?: CanvasTextBaseline; spacing?: number };
export function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: TextOpt) {
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
export function measure(ctx: CanvasRenderingContext2D, s: string, font: string, spacing?: number) {
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
export function shadowCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
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
export function polyline(ctx: CanvasRenderingContext2D, pts: [number, number][], p: number, dx = 0, dy = 0) {
  const n = Math.max(2, Math.floor(pts.length * clamp(p)));
  ctx.beginPath();
  pts.slice(0, n).forEach(([x, y], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy)));
  ctx.stroke();
}

/* ---------- Pierre: eine grosse Zahl ---------- */

export const I = (f: Fonts, w: number, s: number) => `${w} ${s}px ${f.inter}`;
const A = (f: Fonts, w: number, s: number) => `${w} ${s}px ${f.archivo}`;
const M = (f: Fonts, s: number) => `500 ${s}px ${f.mono}`;

/* ---------- Team ---------- */

export const L = (lang: Lang, de: string, en: string) => (lang === "de" ? de : en);
export const standing = (d: Data) => d.team.runners.filter((r) => !r.out);
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
      const base = SAFE_B;
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
      const base = SAFE_B;
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
      const y = SAFE_B - 50 - 120 - ph;
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
      text(ctx, L(lang, `Zwei übrig. Runde ${v.runde}.`, `Two left. Loop ${v.runde}.`), W / 2, SAFE_B, { font: A(f, 700, 48), align: "center", alpha: ease(t, 1.1, 0.5) });
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
      const y = SAFE_B - ch + (1 - p) * 300;
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
      const y = SAFE_B - 150;
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
      const base = SAFE_B;
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
      text(ctx, L(lang, `${n} laufen. Runde ${v.runde}.`, `${n} still going. Loop ${v.runde}.`), 72, SAFE_B, { font: A(f, 800, 64), alpha: ease(t, 1.5, 0.5), spacing: -1 });
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
      const base = SAFE_B - 12;
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

export const TEAM_FORMATS = T;

/** Verlauf über dem Foto, damit die weisse Schrift trägt */
export function drawShade(ctx: CanvasRenderingContext2D, s: Shade, k = 1) {
  if (s === "none" || k <= 0) return;
  const a = (x: number) => `rgba(0,0,0,${Math.min(0.92, x * k).toFixed(3)})`;
  if (s === "all") {
    ctx.fillStyle = a(0.45);
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (s === "b") {
    g.addColorStop(0.4, a(0));
    g.addColorStop(1, a(0.72));
  } else if (s === "t") {
    g.addColorStop(0, a(0.65));
    g.addColorStop(0.55, a(0));
  } else if (s === "m") {
    g.addColorStop(0.18, a(0));
    g.addColorStop(0.5, a(0.6));
    g.addColorStop(0.82, a(0));
  } else {
    g.addColorStop(0, a(0.55));
    g.addColorStop(0.35, a(0));
    g.addColorStop(0.6, a(0));
    g.addColorStop(1, a(0.72));
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
