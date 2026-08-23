"use client";

import { useEffect, useState } from "react";

export const HOUR_MS = 3_600_000;

export type RaceClock = {
  ready: boolean;
  running: boolean;
  lap: number;
  /** Millisekunden bis zur nächsten Glocke */
  toBell: number;
  /** Millisekunden bis zum Start, 0 wenn das Rennen läuft */
  toStart: number;
  intoHour: number;
};

export function useRaceClock(startISO: string, tick = 250): RaceClock {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), tick);
    return () => clearInterval(id);
  }, [tick]);

  const start = new Date(startISO).getTime();
  if (now === null) {
    return { ready: false, running: false, lap: 0, toBell: 0, toStart: 0, intoHour: 0 };
  }

  const elapsed = now - start;
  const running = elapsed >= 0;
  const intoHour = running ? elapsed % HOUR_MS : (HOUR_MS - ((-elapsed) % HOUR_MS)) % HOUR_MS;

  return {
    ready: true,
    running,
    lap: running ? Math.floor(elapsed / HOUR_MS) + 1 : 0,
    toBell: HOUR_MS - intoHour,
    toStart: running ? 0 : -elapsed,
    intoHour,
  };
}

export const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

/** «12 T 04:11:07» vor dem Start, «42:11» bis zur Glocke im Rennen. */
export function countdownText(c: RaceClock): string {
  if (!c.ready) return "··:··";
  if (c.running) return `${pad(c.toBell / 60000)}:${pad((c.toBell % 60000) / 1000)}`;
  const d = Math.floor(c.toStart / 86400000);
  const h = Math.floor((c.toStart % 86400000) / HOUR_MS);
  const m = Math.floor((c.toStart % HOUR_MS) / 60000);
  const s = Math.floor((c.toStart % 60000) / 1000);
  return d > 0 ? `${d} D ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}
