import Link from "next/link";

const COLS = [
  [
    ["Live", "/backyard/live"],
    ["Weltstand", "/welt"],
    ["Kader", "/team"],
  ],
  [
    ["Strecke", "/strecke"],
    ["Format", "/format"],
  ],
];

export default function Footer() {
  return (
    <footer data-hour="tag" className="px-5 py-16" style={{ background: "var(--byd-bg)", color: "var(--byd-fg)" }}>
      <div className="mx-auto max-w-[76rem]">
        <div className="grid gap-10 border-t pt-10 sm:grid-cols-[1fr_auto_auto] rule">
          <div>
            <p className="display text-xl">Team Schweiz</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: "var(--byd-mute)" }}>
              Backyard Ultra World Team Championship, Samstag 17. Oktober 2026, 14:00,
              Vereinshaus SV Baar. Fünfzehn Läuferinnen und Läufer, eine Runde pro Stunde,
              bis niemand mehr kann.
            </p>
          </div>
          {COLS.map((col, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              {col.map(([label, href]) => (
                <Link key={href} href={href} className="stamp">
                  {label}
                </Link>
              ))}
              {i === 1 && (
                <a
                  href="https://bigsbackyardultra.com/world-team-championship-2026/"
                  target="_blank"
                  rel="noreferrer"
                  className="stamp"
                >
                  Big&rsquo;s ↗
                </a>
              )}
            </div>
          ))}
        </div>
        <p className="mt-10 text-xs" style={{ color: "var(--byd-mute)" }}>
          Livedaten über die öffentliche race|result-Schnittstelle der jeweiligen Nation.
          Inoffizielle Seite von und für das Team.
        </p>
      </div>
    </footer>
  );
}
