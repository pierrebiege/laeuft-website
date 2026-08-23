import { PHOTO_BASE, slug, pastResults, type Athlete } from "@/app/backyard/_data/event";

/**
 * Eine Läuferkarte. Oben das Porträt, unten Name und Zahl.
 * Ohne Bild zeigt die Karte Position und Initialen auf schraffiertem Grund –
 * eine Fläche, die gebaut aussieht, nicht leer.
 */
export default function RunnerCard({ a, compact = false }: { a: Athlete; compact?: boolean }) {
  const src = a.photo ? `${PHOTO_BASE}/${a.photo}.jpg` : null;
  const initials = `${a.first[0]}${a.name[0]}`;
  const past = pastResults(a);

  return (
    <article className="flex h-full flex-col border-l rule" style={{ opacity: a.status === "reserve" ? 0.55 : 1 }}>
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: compact ? "4 / 5" : "3 / 4",
          background: src
            ? undefined
            : "repeating-linear-gradient(135deg, var(--byd-rule) 0 1px, transparent 1px 9px)",
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`${a.first} ${a.name}`}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "grayscale(1) contrast(1.06)" }}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <span className="stamp">{a.status === "reserve" ? "Res" : String(a.pos).padStart(2, "0")}</span>
            <span className="display self-end text-5xl leading-none" style={{ color: "var(--byd-rule)" }}>
              {initials}
            </span>
          </div>
        )}
        {src && (
          <span className="stamp absolute left-4 top-4" style={{ color: "#fff", mixBlendMode: "difference" }}>
            {String(a.pos).padStart(2, "0")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-base font-semibold uppercase leading-tight tracking-[-0.01em]">
            {a.first}
            <br />
            {a.name}
          </p>
          <p className="stamp mt-2">
            {a.status === "silver" ? "Silver Ticket" : "At Large"}
            {a.role ? ` · ${a.role}` : ""}
          </p>
        </div>
        <div className="mt-4 flex items-end justify-between border-t pt-3 rule">
          <div>
            <p className="stamp">Qualifying</p>
            <p className="display tnum mt-1 text-3xl leading-none">{a.qual}</p>
          </div>
          <div className="text-right">
            <p className="stamp">{past.length ? "Team champs" : "Debut"}</p>
            <p className="mt-1 font-mono text-xs tnum" style={{ color: "var(--byd-mute)" }}>
              {past.length ? past.map((r) => `${r.year}: ${r.laps}`).join(" · ") : "—"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
