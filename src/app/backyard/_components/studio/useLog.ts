"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/app/backyard/_data/event";
import { DEFAULT_CONFIG, type LapManual, type LogConfig, type LogKey, type RrLap } from "@/app/backyard/_lib/studio-log";

/**
 * Runden-Log mit doppeltem Boden: jede Änderung landet sofort im Browser
 * (localStorage) und wird dann an den Server geschickt. Klappt das nicht
 * (Funkloch, leerer Akku), bleibt sie als «offen» liegen und geht beim
 * nächsten Versuch raus. Der Server ist die Wahrheit für alle Geräte.
 */

type Store = { manual: Record<number, LapManual>; pending: number[]; config: LogConfig | null };
const KEY = (run: string) => `studio-log-v1:${run}`;

function readLocal(run: string): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY(run)) ?? "null") as Store | null;
    if (s && typeof s === "object") return { manual: s.manual ?? {}, pending: s.pending ?? [], config: s.config ?? null };
  } catch {
    /* privates Fenster o. ä. */
  }
  return { manual: {}, pending: [], config: null };
}
function writeLocal(run: string, s: Store) {
  try {
    localStorage.setItem(KEY(run), JSON.stringify(s));
  } catch {
    /* egal, der Server hat es */
  }
}

export function useLog(k: string, run: "live" | "test", enabled: boolean) {
  const [store, setStore] = useState<Store>({ manual: {}, pending: [], config: null });
  const [rr, setRr] = useState<RrLap[]>([]);
  const [msg, setMsg] = useState("");
  const ref = useRef(store);
  ref.current = store;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback(
    (s: Store) => {
      ref.current = s;
      setStore(s);
      writeLocal(run, s);
    },
    [run],
  );

  const pull = useCallback(async () => {
    if (!enabled) return;
    try {
      const r = await fetch(`${API_BASE}/studio-log?k=${encodeURIComponent(k)}&run=${run}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Fehler");
      const cur = ref.current;
      const manual: Record<number, LapManual> = {};
      let config = cur.config;
      for (const row of j.manual as { lap: number; manual: Record<string, unknown> }[]) {
        if (row.lap === -1) {
          if (!cur.pending.includes(-1)) config = { ...DEFAULT_CONFIG, ...(row.manual as Partial<LogConfig>) };
        } else manual[row.lap] = row.manual as LapManual;
      }
      // Was hier noch nicht beim Server ist, bleibt wie im Browser
      for (const lap of cur.pending) if (lap > 0 && cur.manual[lap]) manual[lap] = cur.manual[lap];
      commit({ ...cur, manual, config });
      setRr(j.rr ?? []);
      setMsg(cur.pending.length ? `${cur.pending.length} Änderung(en) noch nicht beim Server` : "Log gespeichert");
    } catch {
      setMsg("Server nicht erreichbar, das Log ist im Browser gesichert");
    }
  }, [enabled, k, run, commit]);

  const flush = useCallback(async () => {
    const cur = ref.current;
    if (!cur.pending.length) return;
    const left: number[] = [];
    for (const lap of cur.pending) {
      const manual = lap === -1 ? cur.config : cur.manual[lap] ?? {};
      try {
        const r = await fetch(`${API_BASE}/studio-log?k=${encodeURIComponent(k)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ run, lap, manual }),
        });
        if (!r.ok) throw new Error();
      } catch {
        left.push(lap);
      }
    }
    // in der Zwischenzeit Getipptes nicht verlieren
    const now = ref.current;
    const pending = [...new Set([...left, ...now.pending.filter((l) => !cur.pending.includes(l))])];
    commit({ ...now, pending });
    setMsg(pending.length ? `${pending.length} Änderung(en) noch nicht beim Server, wird wiederholt` : "Log gespeichert");
  }, [k, run, commit]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  }, [flush]);

  // Lauf wechseln: erst Browser, dann Server
  useEffect(() => {
    if (!enabled) return;
    const local = readLocal(run);
    ref.current = local;
    setStore(local);
    setRr([]);
    pull().then(flush);
    const iv = setInterval(() => flush().then(pull), 30_000);
    const vis = () => document.visibilityState === "visible" && flush().then(pull);
    document.addEventListener("visibilitychange", vis);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [enabled, run, pull, flush]);

  const setField = useCallback(
    (lap: number, key: LogKey, value: string) => {
      const cur = ref.current;
      commit({ ...cur, manual: { ...cur.manual, [lap]: { ...cur.manual[lap], [key]: value } }, pending: [...new Set([...cur.pending, lap])] });
      schedule();
    },
    [commit, schedule],
  );

  /** Handwert entfernen, die Quelle (race|result, Strava, Wetter) gilt wieder */
  const resetField = useCallback(
    (lap: number, key: LogKey) => {
      const cur = ref.current;
      const m = { ...cur.manual[lap] };
      delete m[key];
      commit({ ...cur, manual: { ...cur.manual, [lap]: m }, pending: [...new Set([...cur.pending, lap])] });
      schedule();
    },
    [commit, schedule],
  );

  const setConfig = useCallback(
    (config: LogConfig) => {
      const cur = ref.current;
      commit({ ...cur, config, pending: [...new Set([...cur.pending, -1])] });
      schedule();
    },
    [commit, schedule],
  );

  const resetTest = useCallback(async () => {
    if (run !== "test") return;
    await fetch(`${API_BASE}/studio-log?k=${encodeURIComponent(k)}&run=test`, { method: "DELETE" }).catch(() => null);
    commit({ manual: {}, pending: [], config: ref.current.config });
    pull();
  }, [run, k, commit, pull]);

  return { manual: store.manual, config: store.config ?? DEFAULT_CONFIG, rr, msg, setField, resetField, setConfig, resetTest, reload: pull };
}
