import { KANTONE, KARTE_BREITE, KARTE_HOEHE, LAND, ORTE, SEEN } from "./karte-daten";

/* Die Schweiz als feine Linienzeichnung, darauf die belegten Orte.
   `jahr` bestimmt, welche Punkte sichtbar sind; Punkte aus genau diesem Jahr
   werden hervorgehoben, mit einem Ring, der einmal aufgeht, und beschriftet.
   Ohne `jahr` sind alle Punkte da. */

type Props = {
  jahr?: number;
  ortsnamen?: Record<string, string>;
  beschriften?: boolean;
  className?: string;
  titel?: string;
  hervorheben?: boolean;
  /* Füllt den Rahmen statt hineinzupassen (Bildausschnitt). */
  zuschnitt?: boolean;
  /* Sichtbarer Ausschnitt [x, y, breite, höhe] in Kartenkoordinaten. */
  ausschnitt?: [number, number, number, number];
  /* Verzögerung in Sekunden pro Punkt, abhängig vom Jahr (Hero). */
  verzoegerung?: (jahr: number) => number;
  /* Nur diese Orte zeigen, gross und beschriftet (Initiatoren). */
  nur?: string[];
};

export default function KarteSvg({
  jahr = 2026,
  ortsnamen = {},
  beschriften = true,
  className,
  titel,
  hervorheben = true,
  zuschnitt = false,
  ausschnitt,
  verzoegerung,
  nur,
}: Props) {
  const sichtbar = nur ? ORTE.filter((o) => nur.includes(o.name)) : ORTE.filter((o) => o.jahr <= jahr);
  const neu = nur ? sichtbar : hervorheben ? sichtbar.filter((o) => o.jahr === jahr) : [];
  const box = ausschnitt ?? [0, 0, KARTE_BREITE, KARTE_HOEHE];
  return (
    <svg
      viewBox={box.join(" ")}
      className={className}
      role="img"
      aria-label={titel}
      preserveAspectRatio={zuschnitt ? "xMidYMid slice" : "xMidYMid meet"}
    >
      <path d={LAND} className="pk-k-land" />
      <path d={KANTONE} className="pk-k-kantone" />
      <path d={SEEN} className="pk-k-seen" />
      <path d={LAND} className="pk-k-rand" />
      {hervorheben &&
        !nur &&
        neu.map((o) => <circle key={`r-${o.name}-${jahr}`} cx={o.x} cy={o.y} r={9} className="pk-k-ring" />)}
      {sichtbar.map((o) => {
        const gross = nur || (hervorheben && o.jahr === jahr);
        return (
          <circle
            key={o.name}
            cx={o.x}
            cy={o.y}
            r={nur ? 8 : gross ? 9 : 6.5}
            className={gross ? "pk-k-punkt pk-k-punkt-neu" : "pk-k-punkt"}
            style={verzoegerung ? { animationDelay: `${verzoegerung(o.jahr).toFixed(2)}s` } : undefined}
          />
        );
      })}
      {beschriften &&
        beschriftungen(neu, ortsnamen).map((b) => (
          <text key={`t-${b.name}`} x={b.x} y={b.y} textAnchor={b.anker} className="pk-k-name">
            {b.text}
          </text>
        ))}
    </svg>
  );
}

/* Beschriftungen ohne Überlappung: von oben nach unten setzen, eine
   Beschriftung, die eine schon gesetzte überdecken würde, fällt weg (die
   Liste neben der Karte nennt ohnehin alle Orte des Jahres). */
function beschriftungen(orte: typeof ORTE, ortsnamen: Record<string, string>) {
  const gesetzt: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const raus: { name: string; text: string; x: number; y: number; anker: "start" | "end" }[] = [];
  for (const o of [...orte].sort((a, b) => a.y - b.y)) {
    const text = ortsnamen[o.name] ?? o.name;
    const breite = text.length * 15;
    const links = o.x > KARTE_BREITE - 190;
    const x = links ? o.x - 16 : o.x + 16;
    const box = { x0: links ? x - breite : x, x1: links ? x : x + breite, y0: o.y - 16, y1: o.y + 14 };
    const kollidiert = gesetzt.some((g) => box.x0 < g.x1 && box.x1 > g.x0 && box.y0 < g.y1 && box.y1 > g.y0);
    if (kollidiert) continue;
    gesetzt.push(box);
    raus.push({ name: o.name, text, x, y: o.y + 7, anker: links ? "end" : "start" });
  }
  return raus;
}
