import type { ReactNode } from "react";
import type { Hour } from "./useSectionTheme";

/**
 * Eine Sektion ist eine Rennstunde. Sie trägt ihre Tageszeit und ihren
 * Zeitstempel – oben Samstagnachmittag, unten Sonntagmittag.
 *
 * Bewusst nur eine Kleinbeschriftung: vorher standen Stundenstempel und
 * ein zweiter Mini-Titel nebeneinander, dann kam erst die Überschrift.
 * Drei Beschriftungen für einen Abschnitt, zwei davon ohne Aussage.
 */
export default function Section({
  hour,
  stamp,
  id,
  children,
  wide = false,
  tight = false,
}: {
  hour: Hour;
  stamp: string;
  id?: string;
  children: ReactNode;
  wide?: boolean;
  /** Schliesst oben an die vorige Sektion an, statt den vollen Abstand zu halten. */
  tight?: boolean;
}) {
  return (
    <section
      id={id}
      data-hour={hour}
      data-stamp={stamp}
      className={`px-5 pb-24 sm:pb-32 ${tight ? "pt-4" : "pt-24 sm:pt-32"}`}
    >
      <div className={`mx-auto ${wide ? "max-w-[86rem]" : "max-w-[76rem]"}`}>
        <div className="mb-12 border-b pb-4 rule">
          <span className="stamp">{stamp}</span>
        </div>
        {children}
      </div>
    </section>
  );
}

/** Der Streifen zwischen zwei Tageszeiten. */
export function Dawn({ from, to }: { from: string; to: string }) {
  return <div className="dawn" style={{ "--from": from, "--to": to } as React.CSSProperties} />;
}

export const TONE = {
  tag: "#e9e5dd",
  daemmerung: "#1b1613",
  nacht: "#070709",
  tief: "#000000",
} as const;
