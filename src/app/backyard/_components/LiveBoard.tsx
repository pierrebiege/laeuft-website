"use client";

import { useCallback, useEffect, useState } from "react";
import LapGrid from "./LapGrid";
import type { NationLive } from "@/app/backyard/_lib/raceresult";

type Year = "2026" | "2024";

export default function LiveBoard({ initialYear = "2026" }: { initialYear?: Year }) {
  const [year, setYear] = useState<Year>(initialYear);
  const [data, setData] = useState<NationLive | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/backyard/live?year=${year}&nation=ch`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setPending(Boolean(json.pending));
        setError(json.error ?? "Unbekannter Fehler");
        setData(null);
        return;
      }
      setPending(false);
      setError(null);
      setData(json as NationLive);
      setUpdated(
        new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, [year]);

  useEffect(() => {
    setData(null);
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 rule">
        <span className="stamp flex items-center gap-2.5">
          <span
            className={`h-1.5 w-1.5 ${data && !data.over ? "blink" : ""}`}
            style={{ background: data && !data.over ? "var(--byd-accent)" : "var(--byd-mute)" }}
          />
          {data ? (data.over ? "Rennen beendet" : "Live") : "Verbinde"}
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
              {y === "2026" ? "WM 2026" : "Probelauf 2024"}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <div className="border-b py-16 rule">
          <h2 className="display max-w-xl text-[1.8rem] sm:text-4xl">
            Die Zeitmessung ist noch nicht verbunden.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            Sobald das race|result-Event für Baar 2026 online ist, hängt es hier automatisch
            drin und diese Seite wird live – ohne dass jemand etwas nachpflegen muss.
            Bis dahin läuft das ganze System mit den echten Daten der Team-WM 2024.
          </p>
          <button
            onClick={() => setYear("2024")}
            className="mt-8 border px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: "var(--byd-accent)", color: "#fff", borderColor: "var(--byd-accent)" }}
          >
            Probelauf 2024 starten
          </button>
        </div>
      )}

      {error && !pending && (
        <p className="border-b py-8 text-sm rule" style={{ color: "var(--byd-mute)" }}>
          Daten gerade nicht erreichbar: {error}
        </p>
      )}

      {data && (
        <>
          <div className="grid border-b sm:grid-cols-4 rule">
            <Stat label="Runden total" value={data.laps} accent />
            <Stat label="Aktuelle Runde" value={data.currentLap} />
            <Stat label="Noch im Rennen" value={data.standing} />
            <Stat label="Kilometer" value={Math.round(data.laps * 6.7056)} />
          </div>

          <div className="mt-14">
            <div className="mb-5 flex flex-wrap items-center gap-x-7 gap-y-2">
              <span className="stamp">Jede Runde ein Quadrat</span>
              <span className="stamp flex items-center gap-2">
                <span className="h-2.5 w-2.5" style={{ background: "var(--byd-accent)" }} /> im Rennen
              </span>
              <span className="stamp flex items-center gap-2">
                <span className="h-2.5 w-2.5" style={{ background: "var(--byd-mute)" }} /> ausgeschieden
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
                  <Th>Rang</Th>
                  <Th>Name</Th>
                  <Th>Nat</Th>
                  <Th right>Runden</Th>
                  <Th right>Kilometer</Th>
                  <Th right>Zeit</Th>
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
                          {r.name}
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
            Quelle: {data.eventName} · race|result #{data.eventId} · Liste „{data.listName}“
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
        {value.toLocaleString("de-CH")}
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
