/**
 * Das Rundenraster: jede Runde jedes Läufers ein Quadrat.
 * Volles Team ist eine volle Spalte. Wer raus ist, dessen Zeile hört auf.
 * Fünfzehn Zeilen erzählen das ganze Rennen ohne ein einziges Wort.
 */
export default function LapGrid({
  runners,
  max,
}: {
  runners: { name: string; last?: string; laps: number }[];
  max: number;
}) {
  const cols = Math.max(max, 1);
  const cell = cols > 44 ? 6 : cols > 28 ? 8 : 11;

  return (
    // Rein dekorativ: dieselbe Information steht daneben als Text, und ohne
    // aria-hidden liefert das Raster über 900 leere Felder an den Screenreader.
    <div className="overflow-x-auto" aria-hidden>
      <div className="min-w-max">
        {runners.map((r) => {
          const out = r.laps < max;
          return (
            <div key={r.name} className="flex items-center gap-3 py-[3px]">
              <span
                className="w-36 shrink-0 truncate text-right font-mono text-[11px] uppercase"
                style={{ color: out ? "var(--byd-mute)" : "var(--byd-fg)" }}
                title={r.name}
              >
                {r.last ?? r.name}
              </span>
              <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)` }}>
                {Array.from({ length: cols }).map((_, i) => {
                  const done = i < r.laps;
                  return (
                    <span
                      key={i}
                      style={{
                        width: cell,
                        height: cell,
                        background: done ? (out ? "var(--byd-mute)" : "var(--byd-accent)") : "var(--bar)",
                      }}
                    />
                  );
                })}
              </div>
              <span
                className="ml-2 w-8 shrink-0 font-mono text-[11px] tnum"
                style={{ color: out ? "var(--byd-mute)" : "var(--byd-fg)" }}
              >
                {r.laps}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
