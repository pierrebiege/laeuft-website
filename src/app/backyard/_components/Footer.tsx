import Link from "next/link";

const COLS = [
  [
    ["Live", "/live"],
    ["World", "/world"],
    ["Squad", "/squad"],
  ],
  [
    ["Course", "/course"],
    ["Rules", "/rules"],
  ],
];

export default function Footer() {
  return (
    <footer data-hour="tag" className="px-5 py-16" style={{ background: "var(--byd-bg)", color: "var(--byd-fg)" }}>
      <div className="mx-auto max-w-[76rem]">
        <div className="grid gap-10 border-t pt-10 sm:grid-cols-[1fr_auto_auto] rule">
          <div>
            <p className="display text-xl">Team Switzerland</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: "var(--byd-mute)" }}>
              Backyard Ultra World Team Championship, Saturday 17 October 2026, 14:00,
              Vereinshaus SV Baar. Fifteen runners, one loop an hour.
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
        <p className="mt-10 max-w-2xl text-xs leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Unofficial page, made by and for the team — not by the organisers. Live data
          comes from each nation&rsquo;s public race|result feed. Something wrong on here,
          or want to help on race day?{" "}
          <a href="mailto:info@laeuft.ch" className="underline underline-offset-4">
            info@laeuft.ch
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
