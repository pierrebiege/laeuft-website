"use client";

import { useCallback, useEffect, useState } from "react";
import LapGrid from "./LapGrid";
import { LOOP_M } from "@/app/backyard/_data/event";
import type { NationLive } from "@/app/backyard/_lib/raceresult";

type Year = "2026" | "2024";

export default function LiveBoard({ initialYear = "2026" }: { initialYear?: Year }) {
  const [year, setYear] = useState<Year>(initialYear);
  const [data, setData] = useState<NationLive | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    setData(null);
    try {
      const res = await fetch(`/api/live?year=${year}&nation=ch`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setPending(Boolean(json.pending));
        setError(json.error ?? "Unknown error");
        setData(null);
        return;
      }
      setPending(false);
      setError(null);
      setData(json as NationLive);
      setUpdated(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, [year]);

  const over = Boolean(data?.over);

  useEffect(() => {
    // Daten holen, sobald die Komponente steht oder das Jahr wechselt. Der
    // Server kann das nicht vorbereiten, die Anzeige hängt am Zeitmesssystem.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Ein beendetes Rennen ändert sich nicht mehr, und ein Telefon in der
  // Tasche muss die Zeitmessung nicht alle dreissig Sekunden fragen.
  useEffect(() => {
    if (over) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30_000);
    return () => clearInterval(id);
  }, [load, over]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 rule">
        <span className="stamp flex items-center gap-2.5">
          <span
            className={`h-1.5 w-1.5 ${data && !over ? "blink" : ""}`}
            style={{ background: data && !data.over ? "var(--byd-accent)" : "var(--byd-mute)" }}
          />
          {data ? (data.over ? "Race finished" : "Live") : "Connecting"}
          {updated && ` · ${updated}`}
        </span>

        <div className="flex gap-px">
          {(["2026", "2024"] as Year[]).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className="border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] rule"
              style={
                year === y
                  ? { background: "var(--byd-fg)", color: "var(--byd-bg)", borderColor: "var(--byd-fg)" }
                  : { color: "var(--byd-mute)" }
              }
            >
              {y === "2026" ? "2026" : "2024 replay"}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <div className="border-b py-16 rule">
          <h2 className="display max-w-xl text-[1.8rem] sm:text-4xl">
            Timing not connected yet.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            As soon as the race|result event for Baar 2026 is online it is picked up here
            and the page goes live. Nobody has to type anything in. Until then the whole
            board runs on the real data from the 2024 team championship.
          </p>
          <button
            onClick={() => setYear("2024")}
            className="mt-8 border px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: "var(--byd-accent)", color: "#fff", borderColor: "var(--byd-accent)" }}
          >
            Run the 2024 replay
          </button>
        </div>
      )}

      {error && !pending && (
        <p className="border-b py-8 text-sm rule" style={{ color: "var(--byd-mute)" }}>
          Data not reachable right now: {error}
        </p>
      )}

      {data && (
        <>
          <div className="grid border-b sm:grid-cols-4 rule">
            <Stat label="Loops = points" value={data.laps} accent />
            <Stat label={over ? "Last loop" : "Current loop"} value={data.currentLap} />
            <Stat label={over ? "Went the distance" : "Still running"} value={data.standing} />
            <Stat label="Kilometres" value={Math.round(data.laps * LOOP_M / 1000)} />
          </div>

          <div className="mt-14">
            <div className="mb-5 flex flex-wrap items-center gap-x-7 gap-y-2">
              <span className="stamp">One square per loop</span>
              <span className="stamp flex items-center gap-2">
                <span className="h-2.5 w-2.5" style={{ background: "var(--byd-accent)" }} /> running
              </span>
              <span className="stamp flex items-center gap-2">
                <span className="h-2.5 w-2.5" style={{ background: "var(--byd-mute)" }} /> out
              </span>
            </div>
            <LapGrid
              runners={data.runners.map((r) => ({ name: r.name, last: r.last, laps: r.laps }))}
              max={data.currentLap}
            />
          </div>

          <div className="mt-16 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b text-left rule">
                  <Th>Rank</Th>
                  <Th>Name</Th>
                  <Th>Nat</Th>
                  <Th right>Loops</Th>
                  <Th right>Kilometres</Th>
                  <Th right>Time</Th>
                </tr>
              </thead>
              <tbody>
                {data.runners.map((r) => {
                  const out = r.laps < data.currentLap;
                  return (
                    <tr key={`${r.rank}-${r.name}`} className="border-b rule">
                      <Td mono mute>{String(r.rank).padStart(2, "0")}</Td>
                      <Td>
                        <span
                          className="text-[15px] uppercase tracking-tight"
                          style={{ color: out ? "var(--byd-mute)" : "var(--byd-fg)" }}
                        >
                          {r.first ? `${r.first} ${r.last}` : r.name}
                        </span>
                      </Td>
                      <Td mono mute>{r.nat ?? "–"}</Td>
                      <Td right mono>
                        <span style={{ color: out ? "var(--byd-mute)" : "var(--byd-accent)" }}>{r.laps}</span>
                      </Td>
                      <Td right mono mute>{r.km?.toFixed(0) ?? "–"}</Td>
                      <Td right mono mute>{r.time ?? "–"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-xs" style={{ color: "var(--byd-mute)" }}>
            Source: {data.eventName} · race|result #{data.eventId}
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="border-b py-8 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 rule">
      <p className="stamp mb-3">{label}</p>
      <p className="display tnum text-[2.6rem] leading-none" style={accent ? { color: "var(--byd-accent)" } : undefined}>
        {value.toLocaleString("en-GB")}
      </p>
    </div>
  );
}

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`stamp pb-3 font-normal ${right ? "text-right" : ""}`}>{children}</th>
);

const Td = ({
  children,
  right,
  mono,
  mute,
}: {
  children: React.ReactNode;
  right?: boolean;
  mono?: boolean;
  mute?: boolean;
}) => (
  <td
    className={`py-3.5 ${right ? "text-right" : ""} ${mono ? "font-mono text-xs tnum" : ""}`}
    style={mute ? { color: "var(--byd-mute)" } : undefined}
  >
    {children}
  </td>
);
