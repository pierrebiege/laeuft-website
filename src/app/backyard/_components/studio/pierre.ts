/**
 * Pierres Vorlagen (Look LSU-Recap: Inter, Strava-Orange, weiss).
 *
 * Fast alle bauen auf einem gemeinsamen Satz auf: Zeile oben, grosse Zahl
 * mit Einheit, optional eine zweite Zahl in Orange, Zeile unten und eine
 * Grafik. Der Block steht oben, in der Mitte oder unten, immer innerhalb
 * der Instagram-Zone (SAFE_T … SAFE_B). Leere Werte zeichnen nichts.
 *
 * Alle Zahlen kommen aus dem Runden-Log bis zur gewählten Runde
 * (d.pierre.log, d.pierre.sel). Jedes Feld lässt sich überschreiben.
 */

import {
  clamp, countStr, ease, I, measure, ORANGE, GREY, polyline, projectRoute, roundRect, SAFE_B, SAFE_T, shadowCard, text, ticks, W, H,
  type Cue, type Data, type Env, type Field, type Format, type Opt, type Shade, type Vals,
} from "./formats";
import { isNight, lapClock, LOOP_KM, mmss, NIGHTS, numOf, secOf, type LapRow, type Mark, type Milestone } from "@/app/backyard/_lib/studio-log";

/* ---------- Werte aus dem Log ---------- */

const rowOf = (d: Data, lap = d.pierre.sel) => d.pierre.log.find((r) => r.lap === lap);
const sel = (d: Data) => d.pierre.sel;
const km = (laps: number) => (laps * LOOP_KM).toFixed(1).replace(".", ",");
const sum = (xs: (number | null)[]) => xs.reduce<number>((s, x) => s + (x ?? 0), 0);
const done = (d: Data) => d.pierre.log.filter((r) => r.lap <= sel(d) && r.status !== "out");
const pauseOf = (r?: LapRow) => {
  const s = secOf(r?.zeit);
  return s === null ? null : Math.max(0, 3600 - s);
};
/** «2:40» oder «45 Sekunden» unter zwei Minuten */
const short = (sec: number) => (sec < 120 ? `${sec} Sekunden` : `${mmss(sec)} min`);
const diffStr = (sec: number) => `${sec >= 0 ? "+" : "−"}${mmss(Math.abs(sec))}`;

function marathons(kmVal: number) {
  const r = kmVal / 42.195;
  if (r < 0.8) return "";
  const n = Math.floor(r);
  const fr = r - n;
  if (fr >= 0.8) return n + 1 === 1 ? "fast ein Marathon" : `fast ${n + 1} Marathons`;
  return n === 1 ? "mehr als ein Marathon" : `mehr als ${n} Marathons`;
}

/* ---------- Grafiken ---------- */

type Series = { get: (r: LapRow) => number | null; fmt: (x: number) => string; bell?: boolean; clock?: boolean };
const SERIES: Record<string, Series> = {
  zeit: { get: (r) => secOf(r.zeit), fmt: mmss, bell: true },
  pause: { get: (r) => pauseOf(r), fmt: mmss },
  puls: { get: (r) => numOf(r.puls), fmt: (x) => String(Math.round(x)) },
  temp: { get: (r) => numOf(r.temp), fmt: (x) => `${Math.round(x)}°`, clock: true },
  kcal: { get: (r) => numOf(r.kcal), fmt: (x) => String(Math.round(x)) },
};

type Graphic =
  | { kind: "last"; s: Series; n: number; nums: boolean }
  | { kind: "all"; hl: number; marks?: Mark[] }
  | { kind: "miles"; reached: Milestone[] }
  | { kind: "dots" }
  | { kind: "naps"; laps: LapRow[] }
  | { kind: "teamdots" }
  | { kind: "teamhist" }
  | { kind: "ring"; run: number; a: [string, string]; b: [string, string] };

const X0 = 72;
const BW = W - 144;

function gHeight(g: Graphic, d: Data) {
  switch (g.kind) {
    case "last": return 330;
    case "all": return g.marks?.length ? 360 : 270;
    case "miles": return 150;
    case "dots": {
      const rows = Math.max(1, Math.ceil(sel(d) / 12));
      return rows * 78;
    }
    case "naps": return 300;
    case "teamdots": return 120;
    case "teamhist": return 320;
    case "ring": return 400;
  }
}

const dim = "rgba(255,255,255,.55)";
const label = (e: Env, s: string, x: number, y: number, align: CanvasTextAlign = "center", alpha = 0.8, size = 24) =>
  text(e.ctx, s, x, y, { font: `500 ${size}px ${e.f.mono}`, align, alpha });

function dashed(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

/** Balken der letzten N Runden: die gewählte orange, die anderen weiss */
function barsLast(e: Env, d: Data, g: Extract<Graphic, { kind: "last" }>, y: number, h: number) {
  const { ctx, t, f } = e;
  const s = sel(d);
  const laps = Array.from({ length: g.n }, (_, i) => s - g.n + 1 + i).filter((l) => l >= 1);
  const vals = laps.map((l) => {
    const r = rowOf(d, l);
    return r ? g.s.get(r) : null;
  });
  const top = y + 46; // Platz für Zahlen
  const base = y + h - 46;
  const ph = base - top;
  const max = Math.max(g.s.bell ? 3600 : 0, ...vals.map((v) => v ?? 0)) || 1;
  const gap = g.n > 7 ? 12 : 18;
  const bw = (BW - gap * (g.n - 1)) / g.n;
  const p = ease(t, 0.5, 1.2);
  laps.forEach((l, i) => {
    const x = X0 + i * (bw + gap);
    const v = vals[i];
    const hl = l === s;
    const q = ease(t, 0.5 + i * 0.06, 0.9);
    if (v === null || v <= 0) {
      ctx.fillStyle = dim;
      ctx.fillRect(x, base - 4, bw, 4);
    } else {
      const bh = Math.max(4, (ph * v * q) / max);
      roundRect(ctx, x, base - bh, bw, bh, Math.min(10, bw / 4));
      ctx.fillStyle = hl ? ORANGE : dim;
      ctx.fill();
      if (g.nums) text(ctx, g.s.fmt(v), x + bw / 2, base - bh - 14, { font: I(f, 700, g.n > 7 ? 24 : 30), align: "center", alpha: clamp(q * 2) });
    }
    label(e, g.s.clock ? lapClock(l) : `R${l}`, x + bw / 2, base + 36, "center", hl ? 1 : 0.7, g.n > 8 ? 20 : 24);
  });
  if (g.s.bell) {
    const by = base - ph * (3600 / max) * p;
    if (p > 0) dashed(ctx, X0, X0 + BW, by);
  }
}

/** Ein dünner Balken pro Runde, Nächte hinterlegt, Glockenlinie */
function barsAll(e: Env, d: Data, g: Extract<Graphic, { kind: "all" }>, y: number, h: number) {
  const { ctx, t } = e;
  const n = Math.max(1, sel(d));
  const lab = g.marks?.length ? 120 : 40;
  const top = y + 10;
  const base = y + h - lab;
  const ph = base - top;
  const step = BW / n;
  const bw = Math.max(2, step * 0.62);
  // Nächte
  for (const [a, b] of Object.values(NIGHTS)) {
    if (a > n) continue;
    const x1 = X0 + (a - 1) * step;
    const x2 = X0 + Math.min(b, n) * step;
    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.fillRect(x1, top, x2 - x1, ph);
  }
  const vals = Array.from({ length: n }, (_, i) => secOf(rowOf(d, i + 1)?.zeit));
  const max = 3600;
  vals.forEach((v, i) => {
    const q = ease(t, 0.5 + (i / n) * 1, 0.5);
    const x = X0 + i * step + (step - bw) / 2;
    if (v === null) {
      ctx.fillStyle = dim;
      ctx.fillRect(x, base - 3, bw, 3);
      return;
    }
    const bh = Math.max(3, (ph * Math.min(v, max) * q) / max);
    ctx.fillStyle = i + 1 === g.hl ? ORANGE : dim;
    ctx.fillRect(x, base - bh, bw, bh);
  });
  dashed(ctx, X0, X0 + BW, top);
  label(e, "R1", X0, base + 34, "left");
  label(e, `R${n}`, X0 + BW, base + 34, "right");
  // eigene Marken: oranger Strich, Beschriftung unter den Balken, zweizeilig gegen Überlappen
  if (g.marks?.length) {
    g.marks.forEach((m, i) => {
      const x = X0 + m.laps * step;
      const q = ease(t, 1.4 + i * 0.15, 0.4);
      ctx.save();
      ctx.globalAlpha = q;
      ctx.fillStyle = ORANGE;
      ctx.fillRect(x - 3, top - 14, 6, ph + 24);
      ctx.restore();
      const al: CanvasTextAlign = x < X0 + 120 ? "left" : x > X0 + BW - 120 ? "right" : "center";
      // unter der Zeile R1 … Rn, abwechselnd auf zwei Zeilen
      label(e, `${m.name} · ${m.laps}`, x, base + 72 + (i % 2) * 34, al, q, 22);
    });
  }
}

function miles(e: Env, g: Extract<Graphic, { kind: "miles" }>, y: number) {
  const { ctx, t, f } = e;
  const n = g.reached.length;
  if (!n) return;
  const ly = y + 40;
  const p = ease(t, 0.5, 1.2);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(X0, ly);
  ctx.lineTo(X0 + BW * p, ly);
  ctx.stroke();
  ctx.restore();
  const step = n === 1 ? 0 : BW / (n - 1);
  g.reached.forEach((m, i) => {
    const x = n === 1 ? X0 + 14 : X0 + i * step;
    const q = ease(t, 0.6 + i * 0.18, 0.4);
    if (q <= 0) return;
    ctx.beginPath();
    ctx.arc(x, ly, 14 * q, 0, Math.PI * 2);
    ctx.fillStyle = i === n - 1 ? ORANGE : "#fff";
    ctx.fill();
    const al: CanvasTextAlign = n === 1 || i === 0 ? "left" : i === n - 1 ? "right" : "center";
    text(ctx, m.name, x + (al === "left" ? -14 : al === "right" ? 14 : 0), ly + 64, { font: I(f, 700, 28), align: al, alpha: q });
    label(e, `${String(m.km).replace(".", ",")} km`, x + (al === "left" ? -14 : al === "right" ? 14 : 0), ly + 100, al, q * 0.7, 22);
  });
}

/** Ein Punkt pro Runde, 12 pro Reihe; Tag voll, Nacht als Ring */
function dots(e: Env, d: Data, y: number) {
  const { ctx, t } = e;
  const n = sel(d);
  const gap = 14;
  const dd = (BW - gap * 11) / 12;
  for (let i = 0; i < n; i++) {
    const lap = i + 1;
    const x = X0 + (i % 12) * (dd + gap) + dd / 2;
    const yy = y + Math.floor(i / 12) * (dd + gap) + dd / 2;
    const q = ease(t, 0.4 + (i / Math.max(n, 1)) * 1.2, 0.3);
    if (q <= 0) continue;
    const col = lap === n ? ORANGE : "#fff";
    ctx.beginPath();
    ctx.arc(x, yy, (dd / 2 - 3) * q, 0, Math.PI * 2);
    if (isNight(lap)) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x, yy, (dd / 2 - 6) * q, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = col;
      ctx.fill();
    }
  }
}

/** Nap-Minuten je Nachtrunde: Höhe = Minuten, ohne Nap flach, letzter Nap orange */
function napBars(e: Env, g: Extract<Graphic, { kind: "naps" }>, y: number, h: number) {
  const { ctx, t, f } = e;
  const laps = g.laps;
  if (!laps.length) return;
  const mins = laps.map((r) => numOf(r.napMin) ?? 0);
  const lastNap = mins.reduce((m, v, i) => (v > 0 ? i : m), -1);
  const max = Math.max(5, ...mins);
  const top = y + 46;
  const base = y + h - 46;
  const ph = base - top;
  const gap = laps.length > 9 ? 10 : 16;
  const bw = (BW - gap * (laps.length - 1)) / laps.length;
  laps.forEach((r, i) => {
    const x = X0 + i * (bw + gap);
    const q = ease(t, 0.5 + i * 0.06, 0.8);
    const v = mins[i];
    if (v <= 0) {
      ctx.fillStyle = dim;
      ctx.fillRect(x, base - 4, bw, 4);
    } else {
      const bh = Math.max(6, (ph * v * q) / max);
      roundRect(ctx, x, base - bh, bw, bh, Math.min(10, bw / 4));
      ctx.fillStyle = i === lastNap ? ORANGE : dim;
      ctx.fill();
      text(ctx, String(v), x + bw / 2, base - bh - 14, { font: I(f, 700, 28), align: "center", alpha: clamp(q * 2) });
    }
    label(e, `R${r.lap}`, x + bw / 2, base + 36, "center", 0.7, laps.length > 9 ? 18 : 22);
  });
}

function teamDots(e: Env, d: Data, y: number) {
  const { ctx, t, f } = e;
  const rs = [...d.team.runners].sort((a, b) => Number(a.out) - Number(b.out));
  const n = rs.length || 15;
  const gap = 10;
  const dd = Math.min(56, (BW - gap * (n - 1)) / n);
  rs.forEach((r, i) => {
    const x = X0 + i * (dd + gap) + dd / 2;
    const cy = y + dd / 2 + 4;
    const q = ease(t, 0.4 + i * 0.05, 0.3);
    if (q <= 0) return;
    const me = r.last === "Biege";
    const col = me ? ORANGE : "#fff";
    ctx.beginPath();
    if (r.out) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 5;
      ctx.arc(x, cy, (dd / 2 - 4) * q, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.arc(x, cy, (dd / 2 - 1) * q, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    }
    if (me) text(ctx, "ich", x, cy + dd / 2 + 40, { font: I(f, 700, 26), align: "center", color: ORANGE, alpha: q });
  });
}

/** Schweizer im Rennen nach 6, 12, 18 … Stunden */
function teamHist(e: Env, d: Data, y: number, h: number) {
  const { ctx, t, f } = e;
  const lap = d.team.lap;
  const hs: number[] = [];
  for (let x = 6; x <= Math.max(6, lap); x += 6) hs.push(x);
  const vals = hs.map((hh) => d.team.runners.filter((r) => r.laps >= hh).length);
  const max = d.team.runners.length || 15;
  const top = y + 46;
  const base = y + h - 46;
  const ph = base - top;
  const gap = hs.length > 8 ? 10 : 18;
  const bw = (BW - gap * (hs.length - 1)) / hs.length;
  hs.forEach((hh, i) => {
    const x = X0 + i * (bw + gap);
    const q = ease(t, 0.5 + i * 0.08, 0.8);
    const bh = Math.max(4, (ph * vals[i] * q) / max);
    roundRect(ctx, x, base - bh, bw, bh, Math.min(10, bw / 4));
    ctx.fillStyle = i === hs.length - 1 ? ORANGE : dim;
    ctx.fill();
    text(ctx, String(vals[i]), x + bw / 2, base - bh - 14, { font: I(f, 700, hs.length > 8 ? 24 : 30), align: "center", alpha: clamp(q * 2) });
    label(e, `${hh} h`, x + bw / 2, base + 36, "center", 0.7, hs.length > 8 ? 18 : 24);
  });
}

/** Stundenring: weiss gelaufen, orange Pause bis zur Glocke; rechts zwei Zahlen */
function ring(e: Env, g: Extract<Graphic, { kind: "ring" }>, y: number, align: "left" | "center") {
  const { ctx, t, f } = e;
  const r = 160;
  const cx = (align === "center" ? W / 2 - 250 : X0) + r + 10;
  const cy = y + r + 30;
  const p = ease(t, 0.4, 1.4);
  const run = clamp(g.run / 3600);
  ctx.save();
  ctx.lineWidth = 36;
  ctx.lineCap = "butt";
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const a0 = -Math.PI / 2;
  ctx.strokeStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a0 + Math.PI * 2 * run * p);
  ctx.stroke();
  if (p >= 1 && run < 1) {
    const q = ease(t, 1.8, 0.5);
    ctx.strokeStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0 + Math.PI * 2 * run, a0 + Math.PI * 2 * (run + (1 - run) * q));
    ctx.stroke();
  }
  ctx.restore();
  const tx = cx + r + 70;
  if (g.a[1]) {
    text(ctx, g.a[0], tx, cy - 70, { font: I(f, 700, 36), alpha: ease(t, 0.5, 0.4) * 0.9 });
    text(ctx, countStr(g.a[1], ease(t, 0.5, 1.2)), tx - 4, cy + 30, { font: I(f, 900, 120), alpha: ease(t, 0.5, 0.3), spacing: -5 });
  }
  if (g.b[1]) {
    text(ctx, g.b[0], tx, cy + 92, { font: I(f, 700, 36), color: ORANGE, alpha: ease(t, 1.8, 0.4) });
    text(ctx, g.b[1], tx - 2, cy + 180, { font: I(f, 900, 84), color: ORANGE, alpha: ease(t, 1.9, 0.4), spacing: -3 });
  }
}

function drawGraphic(e: Env, d: Data, g: Graphic, y: number, h: number, align: "left" | "center") {
  switch (g.kind) {
    case "last": return barsLast(e, d, g, y, h);
    case "all": return barsAll(e, d, g, y, h);
    case "miles": return miles(e, g, y);
    case "dots": return dots(e, d, y);
    case "naps": return napBars(e, g, y, h);
    case "teamdots": return teamDots(e, d, y);
    case "teamhist": return teamHist(e, d, y, h);
    case "ring": return ring(e, g, y, align);
  }
}

/* ---------- gemeinsamer Satz ---------- */

type View = { graphic?: Graphic | null };
type Layout = { align: "left" | "center"; anchor: "top" | "mid" | "bottom"; size: number; s2size?: number };

function block(e: Env, d: Data, v: Vals, o: Vals, lay: Layout, view: View) {
  const { ctx, t, f } = e;
  const anchor = (o.pos && o.pos !== "auto" ? o.pos : lay.anchor) as Layout["anchor"];
  const showTop = o.showTop !== "0" && !!v.top?.trim();
  const showBot = o.showBottom === "1" && !!v.bottom?.trim();
  const num = (v.num ?? "").trim();
  const unit = num ? (v.unit ?? "").trim() : "";
  const s2 = o.second === "1" && (v.s2num ?? "").trim() ? { label: (v.s2label ?? "").trim(), num: v.s2num.trim(), unit: (v.s2unit ?? "").trim() } : null;
  const g = view.graphic ?? null;

  // Zahl so gross wie möglich, aber nie breiter als die Fläche
  const unitSize = Math.round(lay.size * 0.18);
  const fitNum = (size: number, s: string, u: string, us: number) => {
    if (!s) return size;
    const w = measure(ctx, s, I(f, 900, size), -size * 0.06) + (u ? 18 + measure(ctx, u, I(f, 700, us)) : 0);
    return w > BW ? Math.floor((size * BW) / w) : size;
  };
  const size = fitNum(lay.size, num, unit, unitSize);
  const s2size = s2 ? fitNum(lay.s2size ?? Math.round(lay.size * 0.55), s2.num, s2.unit, Math.round((lay.s2size ?? lay.size * 0.55) * 0.2)) : 0;

  const parts: { h: number; draw: (y: number) => void }[] = [];
  const x = lay.align === "center" ? W / 2 : X0;
  const al: CanvasTextAlign = lay.align === "center" ? "center" : "left";
  const a = ease(t, 0.15, 0.5);
  const n = ease(t, 0.3, 1.1);

  if (showTop) parts.push({ h: 46, draw: (y) => text(ctx, v.top, x, y + 38 - (1 - a) * 20, { font: I(f, 700, 38), align: al, alpha: a * 0.9 }) });
  const numRow = (s: string, u: string, sz: number, col: string, at: number) => (y: number) => {
    const us = Math.max(28, Math.round(sz * (sz === size ? 0.18 : 0.2)));
    const w = measure(ctx, s, I(f, 900, sz), -sz * 0.06);
    const total = w + (u ? 18 + measure(ctx, u, I(f, 700, us)) : 0);
    const x0 = lay.align === "center" ? W / 2 - total / 2 : X0 - sz * 0.02;
    const base = y + sz * 0.73;
    text(ctx, countStr(s, ease(t, at, 1.1)), x0, base, { font: I(f, 900, sz), color: col, alpha: ease(t, at, 0.3), spacing: -sz * 0.06 });
    if (u) text(ctx, u, x0 + w + 18, base, { font: I(f, 700, us), color: col, alpha: ease(t, at + 0.9, 0.4) });
  };
  if (num) parts.push({ h: size * 0.73, draw: numRow(num, unit, size, "#fff", 0.3) });
  if (s2) {
    if (s2.label) parts.push({ h: 44, draw: (y) => text(ctx, s2.label, x, y + 36, { font: I(f, 700, 36), align: al, color: ORANGE, alpha: ease(t, 0.8, 0.4) }) });
    parts.push({ h: s2size * 0.73, draw: numRow(s2.num, s2.unit, s2size, ORANGE, 0.8) });
  }
  if (showBot) {
    let bs = 36;
    while (bs > 24 && measure(ctx, v.bottom, I(f, 700, bs)) > BW) bs -= 2;
    parts.push({ h: 40, draw: (y) => text(ctx, v.bottom, x, y + bs, { font: I(f, 700, bs), align: al, alpha: ease(t, 1.3, 0.5) * 0.9 }) });
  }
  if (g) {
    const gh = gHeight(g, d);
    parts.push({ h: gh, draw: (y) => drawGraphic(e, d, g, y, gh, lay.align) });
  }
  void n;

  const gap = 30;
  const total = parts.reduce((s, p) => s + p.h, 0) + gap * Math.max(0, parts.length - 1);
  let y = anchor === "top" ? SAFE_T + 60 : anchor === "mid" ? (H - total) / 2 : SAFE_B - total;
  y = Math.max(SAFE_T, Math.min(y, SAFE_B - total));
  for (const p of parts) {
    p.draw(y);
    y += p.h + gap;
  }
}

/* ---------- Optionen ---------- */

const POS: Opt = { key: "pos", label: "Position", def: "auto", choices: [["auto", "Standard"], ["top", "oben"], ["mid", "Mitte"], ["bottom", "unten"]] };
const SHADE: Opt = { key: "shade", label: "Verlauf", def: "auto", choices: [["auto", "Standard"], ["off", "aus"], ["light", "leicht"], ["strong", "stark"]] };
const showTop = (def = "1"): Opt => ({ key: "showTop", label: "Zeile oben zeigen", def });
const showBottom = (def = "0"): Opt => ({ key: "showBottom", label: "Zeile unten zeigen", def });
const second = (def = "0"): Opt => ({ key: "second", label: "Zweite Zahl in Orange", def });
const graphicOpt = (choices: [string, string][], def = "off"): Opt => ({ key: "graphic", label: "Grafik", def, choices: [["off", "keine"], ...choices] });
const barN: Opt = { key: "barN", label: "Anzahl Runden", def: "5", choices: ["3", "4", "5", "6", "7", "8", "9", "10"].map((x) => [x, x]), when: (o) => o.graphic === "last" };
const barNums = (def: string): Opt => ({ key: "barNums", label: "Zahlen über den Balken", def, when: (o) => o.graphic === "last" });

const BASE_FIELDS = (numLabel: string, o: Vals, extra: Field[] = []): Field[] => [
  { key: "top", label: "Zeile oben" },
  { key: "num", label: numLabel },
  { key: "unit", label: "Einheit" },
  ...extra,
  ...(o.second === "1" ? [{ key: "s2label", label: "Zweite Zahl: Text" }, { key: "s2num", label: "Zweite Zahl" }, { key: "s2unit", label: "Zweite Zahl: Einheit" }] : []),
  { key: "bottom", label: "Zeile unten" },
];

/** Verlauf: Standard der Vorlage, wandert mit der Position, Stärke wählbar */
const shadeFor = (def: Shade, defAnchor: Layout["anchor"]) => (o: Vals): [Shade, number] => {
  const k = o.shade === "off" ? 0 : o.shade === "light" ? 0.6 : o.shade === "strong" ? 1.35 : 1;
  const pos = o.pos && o.pos !== "auto" ? o.pos : defAnchor;
  const s: Shade = pos === defAnchor ? def : pos === "top" ? "t" : pos === "mid" ? "m" : "b";
  return [s, k];
};

const numCues = (): Cue[] => [{ at: 0.15, kind: "whoosh" }, ...ticks(0.3, 1.1, 12), { at: 1.4, kind: "pop" }];
const gCues = (o: Vals): Cue[] => (o.graphic && o.graphic !== "off" ? ticks(0.6, 1, 8) : []);

/** Vorlage auf dem gemeinsamen Satz */
function std(def: {
  id: string;
  name: string;
  shade: Shade;
  layout: Layout;
  numLabel: string;
  len?: number;
  opts?: Opt[];
  extraFields?: Field[];
  prefill: (d: Data, o: Vals) => Vals;
  graphic?: (d: Data, o: Vals, v: Vals) => Graphic | null;
  cues?: (v: Vals, o: Vals) => Cue[];
}): Format {
  return {
    id: def.id,
    group: "pierre",
    name: def.name,
    shade: def.shade,
    shadeFor: shadeFor(def.shade, def.layout.anchor),
    len: def.len ?? 1.8,
    opts: [...(def.opts ?? []), POS, SHADE],
    fields: (o) => BASE_FIELDS(def.numLabel, o, def.extraFields),
    prefill: def.prefill,
    draw: (e, v, d, o) => block(e, d, v, o, def.layout, { graphic: def.graphic?.(d, o, v) ?? null }),
    cues: (v, o) => [...(def.cues ?? numCues)(v, o), ...gCues(o)],
  };
}

const lastBars = (key: keyof typeof SERIES) => (d: Data, o: Vals): Graphic | null =>
  o.graphic === "last" ? { kind: "last", s: SERIES[key], n: Number(o.barN) || 5, nums: o.barNums === "1" } : null;

/* ---------- die Vorlagen ---------- */

export const PIERRE_FORMATS: Format[] = [
  std({
    id: "p-runde", name: "Runde", shade: "b", numLabel: "Runde",
    layout: { align: "left", anchor: "bottom", size: 420 },
    opts: [showTop(), showBottom("0"), second(), graphicOpt([["dots", "Punkte pro Runde"]])],
    prefill: (d) => ({ top: "Runde", num: String(sel(d) || 1), unit: "", bottom: sel(d) ? `${km(sel(d))} km · ${sel(d)} h im Rennen` : "", s2label: "", s2num: "", s2unit: "" }),
    graphic: (d, o) => (o.graphic === "dots" && sel(d) ? { kind: "dots" } : null),
  }),
  std({
    id: "p-gefinished", name: "Runde gefinished", shade: "t", numLabel: "Zeit (mm:ss)",
    layout: { align: "center", anchor: "top", size: 300 },
    opts: [
      showTop(), showBottom("0"),
      { key: "zeile", label: "Zeile unten", def: "glocke", choices: [["glocke", "vor der Glocke"], ["vergleich", "Vergleich Vorrunde"]] },
      second("0"), graphicOpt([["last", "Balken letzte Runden"]]), barN, barNums("0"),
    ],
    prefill: (d, o) => {
      const r = rowOf(d);
      const s = secOf(r?.zeit);
      const prev = secOf(rowOf(d, sel(d) - 1)?.zeit);
      let bottom = "";
      if (o.zeile === "vergleich") {
        if (s !== null && prev !== null && s !== prev) bottom = `${mmss(Math.abs(s - prev))} ${s > prev ? "langsamer" : "schneller"} als Runde ${sel(d) - 1}`;
      } else if (s !== null && s < 3600) bottom = `${short(3600 - s)} vor der Glocke`;
      const p = pauseOf(r);
      return { top: `Runde ${sel(d)} gefinished in`, num: r?.zeit ?? "", unit: "", bottom, s2label: "Pause", s2num: p === null ? "" : mmss(p), s2unit: "min" };
    },
    graphic: lastBars("zeit"),
  }),
  {
    id: "p-ring", group: "pierre", name: "Rundenzeit Ring", shade: "t", shadeFor: shadeFor("t", "top"), len: 2.4,
    opts: [showTop(), showBottom("0"), { key: "ringB", label: "Zweite Zahl", def: "diff", choices: [["diff", "Differenz zur Vorrunde"], ["pause", "Pause bis zur Glocke"]] }, POS, SHADE],
    fields: [
      { key: "top", label: "Zeile oben" }, { key: "num", label: "Grosse Zeile" },
      { key: "r1label", label: "Text weiss" }, { key: "r1num", label: "Zeit gelaufen (mm:ss)" },
      { key: "s2label", label: "Text orange" }, { key: "s2num", label: "Zahl orange" },
      { key: "bottom", label: "Zeile unten" },
    ],
    prefill: (d, o) => {
      const r = rowOf(d);
      const s = secOf(r?.zeit);
      const prev = secOf(rowOf(d, sel(d) - 1)?.zeit);
      const b: [string, string] =
        o.ringB === "pause"
          ? ["Pause bis zur Glocke", s === null ? "" : mmss(Math.max(0, 3600 - s))]
          : [`zu Runde ${sel(d) - 1}`, s !== null && prev !== null ? diffStr(s - prev) : ""];
      return { top: "", num: `Runde ${sel(d)}`, unit: "", r1label: "gelaufen", r1num: r?.zeit ?? "", s2label: b[0], s2num: b[1], bottom: "" };
    },
    draw: (e, v, d, o) =>
      block(e, d, { ...v, unit: "" }, { ...o, second: "0" }, { align: "left", anchor: "top", size: 200 }, {
        graphic: { kind: "ring", run: secOf(v.r1num) ?? 0, a: [v.r1label, v.r1num], b: [v.s2label, v.s2num] },
      }),
    cues: () => [{ at: 0.15, kind: "whoosh" }, ...ticks(0.5, 1.2, 12), { at: 1.8, kind: "pop" }],
  },
  {
    id: "p-strava", group: "pierre", name: "Strava-Karte", shade: "none", len: 2.2,
    fields: [{ key: "km", label: "km" }, { key: "zeit", label: "Zeit" }, { key: "puls", label: "Puls Ø" }],
    prefill: (d) => {
      const l = d.pierre.laps.at(-1);
      const r = rowOf(d);
      return { km: l ? (l.distance / 1000).toFixed(2) : "", zeit: r?.zeit ?? "", puls: r?.puls ?? "" };
    },
    draw: (e, v, d) => {
      const { ctx, t, f } = e;
      const p = ease(t, 0.1, 0.7);
      const ch = 420;
      const y = SAFE_B - ch + (1 - p) * 500;
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
      const rows = ([[v.km, "km"], [v.zeit, "Zeit"], [v.puls, "Puls Ø"]] as [string, string][]).filter((r) => r[0]?.trim());
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
    prefill: (d) => ({ bpm: String(d.pierre.laps.at(-1)?.maxHr ?? "") }),
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
      if (v.bpm?.trim()) {
        const n = ease(t, 0.4, 1.2);
        const beat = 1 + 0.04 * Math.max(0, Math.sin(t * Math.PI * 2 * 1.6)) * (t > 1.6 ? 1 : 0);
        ctx.save();
        ctx.translate(66, SAFE_B);
        ctx.scale(beat, beat);
        text(ctx, countStr(v.bpm, n), 0, 0, { font: I(f, 900, 300), alpha: ease(t, 0.4, 0.3), spacing: -18 });
        const w = measure(ctx, v.bpm, I(f, 900, 300), -18);
        text(ctx, "bpm", w + 16, 0, { font: I(f, 700, 56), alpha: ease(t, 1.3, 0.4) });
        ctx.restore();
      }
    },
    cues: () => [...ticks(0.4, 1.2, 12), { at: 1.7, kind: "pop" }, { at: 2.3, kind: "pop" }],
  },
  std({
    id: "p-langsam", name: "Langsamste / schnellste", shade: "t", numLabel: "Zeit (mm:ss)", len: 2,
    layout: { align: "center", anchor: "top", size: 300 },
    opts: [
      { key: "art", label: "Welche", def: "langsam", choices: [["langsam", "Langsamste"], ["schnell", "Schnellste"]] },
      showTop(), showBottom("1"), second(), graphicOpt([["all", "Balken über alle Runden"]]),
    ],
    prefill: (d, o) => {
      const laps = done(d).filter((r) => secOf(r.zeit) !== null);
      const pick = laps.reduce<LapRow | null>((m, r) => {
        if (!m) return r;
        const a = secOf(r.zeit)!;
        const b = secOf(m.zeit)!;
        return o.art === "schnell" ? (a < b ? r : m) : a > b ? r : m;
      }, null);
      const s = secOf(pick?.zeit);
      const rest = s === null ? -1 : 3600 - s;
      const bottom = pick ? (rest >= 0 && rest < 600 ? `Runde ${pick.lap} · ${rest < 120 ? `${rest} Sekunden` : `${Math.round(rest / 60)} Minuten`} vor der Glocke` : `Runde ${pick.lap}`) : "";
      return { top: `${o.art === "schnell" ? "Schnellste" : "Langsamste"} Runde bisher`, num: pick?.zeit ?? "", unit: "", bottom, s2label: "", s2num: "", s2unit: "", hl: String(pick?.lap ?? "") };
    },
    graphic: (d, o, v) => (o.graphic === "all" ? { kind: "all", hl: Number(v.hl) || 0 } : null),
    cues: () => [...numCues(), { at: 1.3, kind: "pop" }],
  }),
  std({
    id: "p-stuhl", name: "Zeit im Stuhl", shade: "b", numLabel: "Pause (mm:ss)",
    layout: { align: "left", anchor: "bottom", size: 330 },
    opts: [showTop(), showBottom("0"), second(), graphicOpt([["last", "Balken letzte Runden"]]), barN, barNums("1")],
    prefill: (d) => {
      const p = pauseOf(rowOf(d));
      return { top: `Pause vor Runde ${sel(d) + 1}`, num: p === null ? "" : mmss(p), unit: "min", bottom: "", s2label: "Puls im Stuhl", s2num: rowOf(d)?.pulsStuhl ?? "", s2unit: "bpm" };
    },
    graphic: lastBars("pause"),
  }),
  std({
    id: "p-uhrzeit", name: "Uhrzeit", shade: "t", numLabel: "Uhrzeit",
    layout: { align: "center", anchor: "top", size: 300 },
    opts: [showTop(), showBottom("0"), second()],
    prefill: (d) => ({ top: `Runde ${sel(d) + 1} startet`, num: lapClock(sel(d) + 1), unit: "", bottom: "", s2label: "", s2num: "", s2unit: "" }),
    cues: () => [{ at: 0.15, kind: "whoosh" }, { at: 0.5, kind: "bell" }],
  }),
  std({
    id: "p-km", name: "Kilometer", shade: "b", numLabel: "km",
    layout: { align: "left", anchor: "bottom", size: 330 },
    opts: [showTop(), showBottom("0"), second(), graphicOpt([["miles", "Meilensteine"]])],
    prefill: (d) => {
      const k = sel(d) * LOOP_KM;
      return { top: "Seit Samstag, 14 Uhr", num: sel(d) ? km(sel(d)) : "", unit: "km", bottom: marathons(k), s2label: "", s2num: "", s2unit: "" };
    },
    graphic: (d, o, v) => {
      if (o.graphic !== "miles") return null;
      const k = numOf(v.num) ?? sel(d) * LOOP_KM;
      const reached = [...d.pierre.config.miles].sort((a, b) => a.km - b.km).filter((m) => m.km <= k);
      return reached.length ? { kind: "miles", reached } : null;
    },
  }),
  std({
    id: "p-pulsvs", name: "Puls Strecke / Stuhl", shade: "b", numLabel: "Puls Strecke",
    layout: { align: "left", anchor: "bottom", size: 260, s2size: 260 },
    opts: [showTop(), showBottom("0"), second("1"), graphicOpt([["last", "Balken Ø Puls"]]), barN, barNums("1")],
    prefill: (d) => {
      const r = rowOf(d);
      return { top: "auf der Strecke", num: r?.puls ?? "", unit: "bpm", bottom: "", s2label: "im Stuhl", s2num: r?.pulsStuhl ?? "", s2unit: "bpm" };
    },
    graphic: lastBars("puls"),
    cues: () => [...ticks(0.3, 1, 8), ...ticks(0.8, 1, 8), { at: 1.8, kind: "pop" }],
  }),
  std({
    id: "p-kcal", name: "Kalorien", shade: "b", numLabel: "kcal",
    layout: { align: "left", anchor: "bottom", size: 330 },
    opts: [showTop(), showBottom("1"), second(), graphicOpt([["last", "Balken kcal pro Runde"]]), barN, barNums("0")],
    prefill: (d) => {
      const vals = done(d).map((r) => numOf(r.kcal));
      const has = vals.some((x) => x !== null);
      const one = numOf(rowOf(d)?.kcal);
      return {
        top: "Seit Samstag verbrannt, ca.",
        num: has ? String(Math.round(sum(vals))).replace(/\B(?=(\d{3})+(?!\d))/g, "’") : "",
        unit: "kcal",
        bottom: one !== null ? `Runde ${sel(d)}: ${Math.round(one)} kcal` : "",
        s2label: "", s2num: "", s2unit: "",
      };
    },
    graphic: lastBars("kcal"),
  }),
  std({
    id: "p-temp", name: "Temperatur", shade: "b", numLabel: "Grad",
    layout: { align: "left", anchor: "bottom", size: 330 },
    opts: [showTop(), showBottom("0"), second(), graphicOpt([["last", "Balken letzte Runden"]]), barN, barNums("1")],
    prefill: (d) => {
      const r = rowOf(d);
      const isLatest = sel(d) === d.pierre.log.filter((x) => x.status !== "out").at(-1)?.lap;
      const g = r?.temp || (isLatest && d.pierre.temp !== null ? String(Math.round(d.pierre.temp)) : "");
      return { top: `${lapClock(sel(d))} · Runde ${sel(d)}`, num: g ? `${g}°` : "", unit: "", bottom: "", s2label: "", s2num: "", s2unit: "" };
    },
    graphic: lastBars("temp"),
  }),
  std({
    id: "p-nacht", name: "Nacht überstanden", shade: "t", numLabel: "Grosse Zeile", len: 2,
    layout: { align: "center", anchor: "top", size: 240 },
    opts: [showTop(), showBottom("1"), second(), graphicOpt([["naps", "Nap-Minuten pro Nachtrunde"]])],
    prefill: (d) => ({ top: "Sonntag, Sonnenaufgang", num: `Nacht ${sel(d) > 42 ? 2 : 1}`, unit: "", bottom: "überstanden", s2label: "", s2num: "", s2unit: "" }),
    graphic: (d, o, v) => {
      if (o.graphic !== "naps") return null;
      const k = /2/.test(v.num ?? "") ? 2 : 1;
      const [a, b] = NIGHTS[k];
      const laps = d.pierre.log.filter((r) => r.lap >= a && r.lap <= Math.min(b, sel(d)));
      return laps.length ? { kind: "naps", laps } : null;
    },
    cues: () => [{ at: 0.15, kind: "whoosh" }, { at: 0.6, kind: "pop" }, { at: 1.3, kind: "pop" }],
  }),
  std({
    id: "p-letzte", name: "Letzte Runde", shade: "tb", numLabel: "Runden", len: 2,
    layout: { align: "center", anchor: "top", size: 300 },
    opts: [showTop(), showBottom("1"), second(), graphicOpt([["all", "Balken über alle Runden"]])],
    prefill: (d) => {
      const n = sel(d) || 1;
      const last = secOf(rowOf(d, n)?.zeit);
      const sec = last !== null ? (n - 1) * 3600 + last : n * 3600;
      return { top: "Letzte Runde", num: String(n), unit: "", bottom: `${km(n)} km · ${Math.floor(sec / 3600)} h ${Math.floor((sec % 3600) / 60)} min`, s2label: "", s2num: "", s2unit: "" };
    },
    graphic: (d, o) => (o.graphic === "all" ? { kind: "all", hl: sel(d) } : null),
    cues: () => [{ at: 0.15, kind: "bell" }, ...ticks(0.3, 1.1, 12), { at: 1.4, kind: "pop" }],
  }),
  std({
    id: "p-naps", name: "Naps", shade: "b", numLabel: "Anzahl",
    layout: { align: "left", anchor: "bottom", size: 330, s2size: 150 },
    opts: [
      { key: "zeitraum", label: "Zeitraum", def: "alle", choices: [["alle", "seit Samstag"], ["1", "Nacht 1"], ["2", "Nacht 2"]] },
      showTop(), showBottom("1"), second("1"), graphicOpt([["naps", "Nap-Minuten pro Nachtrunde"]]),
    ],
    prefill: (d, o) => {
      const all = done(d);
      if (o.zeitraum === "1" || o.zeitraum === "2") {
        const [a, b] = NIGHTS[Number(o.zeitraum)];
        const laps = all.filter((r) => r.lap >= a && r.lap <= b);
        const mins = sum(laps.map((r) => numOf(r.napMin)));
        const count = sum(laps.map((r) => numOf(r.naps)));
        return { top: `Hingelegt in Nacht ${o.zeitraum}`, num: mins ? String(mins) : "", unit: "min", bottom: count ? `in ${count} ${count === 1 ? "Pause" : "Pausen"}` : "", s2label: "", s2num: "", s2unit: "" };
      }
      const count = sum(all.map((r) => numOf(r.naps)));
      const mins = sum(all.map((r) => numOf(r.napMin)));
      return { top: "Hingelegt seit Samstag", num: count ? String(count) : "", unit: count === 1 ? "Nap" : "Naps", bottom: sel(d) ? `${sel(d)} h im Rennen` : "", s2label: "zusammen", s2num: mins ? String(mins) : "", s2unit: "min" };
    },
    graphic: (d, o) => {
      if (o.graphic !== "naps") return null;
      const k = o.zeitraum === "2" ? 2 : o.zeitraum === "1" ? 1 : sel(d) >= 30 ? 2 : 1;
      const [a, b] = NIGHTS[k];
      const laps = d.pierre.log.filter((r) => r.lap >= a && r.lap <= Math.min(b, sel(d)));
      return laps.length ? { kind: "naps", laps } : null;
    },
  }),
  std({
    id: "p-marken", name: "Eigene Marken", shade: "b", numLabel: "Runden",
    layout: { align: "left", anchor: "bottom", size: 300 },
    opts: [showTop(), showBottom("1"), second(), graphicOpt([["all", "Balken über alle Runden"]], "all")],
    prefill: (d) => {
      const passed = [...d.pierre.config.marks].filter((m) => m.laps > 0 && sel(d) > m.laps).sort((a, b) => b.laps - a.laps);
      const m = passed[0];
      return {
        top: m ? `Weiter als ${m.name}` : "Runde",
        num: String(sel(d)),
        unit: "Runden",
        bottom: m ? `${m.name}: ${m.laps} Runden` : "",
        s2label: "", s2num: "", s2unit: "",
      };
    },
    graphic: (d, o) => {
      if (o.graphic !== "all") return null;
      const marks = d.pierre.config.marks.filter((m) => m.laps > 0 && sel(d) > m.laps).sort((a, b) => a.laps - b.laps);
      return { kind: "all", hl: sel(d), marks };
    },
  }),
  std({
    id: "p-team", name: "Team-Punkte", shade: "b", numLabel: "Laufen noch",
    layout: { align: "left", anchor: "bottom", size: 300 },
    opts: [showTop(), showBottom("1"), second(), graphicOpt([["teamdots", "15 Punkte"]], "teamdots")],
    prefill: (d) => {
      const n = d.team.runners.filter((r) => !r.out).length;
      return { top: "Noch im Rennen", num: String(n), unit: `von ${d.team.runners.length || 15}`, bottom: `Runde ${d.team.lap}`, s2label: "", s2num: "", s2unit: "" };
    },
    graphic: (_d, o) => (o.graphic === "teamdots" ? { kind: "teamdots" } : null),
  }),
  std({
    id: "p-teamverlauf", name: "Team-Verlauf", shade: "b", numLabel: "Laufen noch",
    layout: { align: "left", anchor: "bottom", size: 260 },
    opts: [showTop(), showBottom("0"), second(), graphicOpt([["teamhist", "Balken je 6 Stunden"]], "teamhist")],
    prefill: (d) => {
      const n = d.team.runners.filter((r) => !r.out).length;
      return { top: "Schweizer im Rennen", num: String(n), unit: `von ${d.team.runners.length || 15}`, bottom: `nach ${d.team.lap} Stunden`, s2label: "", s2num: "", s2unit: "" };
    },
    graphic: (_d, o) => (o.graphic === "teamhist" ? { kind: "teamhist" } : null),
  }),
  std({
    id: "p-frei", name: "Freitext", shade: "b", numLabel: "Grosse Zeile",
    layout: { align: "left", anchor: "bottom", size: 200 },
    opts: [showTop(), showBottom("1"), second()],
    prefill: () => ({ top: "", num: "", unit: "", bottom: "", s2label: "", s2num: "", s2unit: "" }),
    cues: () => [{ at: 0.15, kind: "whoosh" }, { at: 0.6, kind: "pop" }],
  }),
];
