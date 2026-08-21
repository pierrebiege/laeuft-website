import type { ReactNode } from "react";
import type { Hour } from "./useSectionTheme";

/**
 * Eine Sektion ist eine Rennstunde. Sie trägt ihre Tageszeit
 * und ihren Zeitstempel – oben Samstagnachmittag, unten Sonntagmorgen.
 */
export default function Section({
  hour,
  stamp,
  title,
  id,
  children,
  wide = false,
}: {
  hour: Hour;
  stamp: string;
  title?: string;
  id?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section id={id} data-hour={hour} data-stamp={stamp} className="px-5 py-24 sm:py-32">
      <div className={`mx-auto ${wide ? "max-w-[86rem]" : "max-w-[76rem]"}`}>
        <div className="mb-12 flex items-baseline justify-between gap-6 border-b pb-4 rule">
          <span className="stamp">{stamp}</span>
          {title && <span className="stamp text-right">{title}</span>}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Der Streifen zwischen zwei Tageszeiten. */
export function Dawn({ from, to }: { from: string; to: string }) {
  return <div className="dawn" style={{ "--byd-from": from, "--byd-to": to } as React.CSSProperties} />;
}

export const TONE = {
  tag: "#e9e5dd",
  daemmerung: "#1b1613",
  nacht: "#070709",
  tief: "#000000",
} as const;
