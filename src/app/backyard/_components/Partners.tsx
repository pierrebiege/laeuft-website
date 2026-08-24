import { PARTNERS, LOGO_BASE } from "@/app/backyard/_data/event";

/**
 * Die Partnerzeile. Monochrom wie der Rest der Seite: Logos werden
 * schwarzweiss gestellt, ohne Logodatei steht der Name als Wortmarke.
 * Rendert nichts, solange kein Partner eingetragen ist.
 */
export default function Partners() {
  if (!PARTNERS.length) return null;

  return (
    <section data-hour="tag" data-stamp="Partners" className="px-5 py-20">
      <div className="mx-auto max-w-[76rem]">
        <div className="mb-10 border-b pb-4 rule">
          <span className="stamp">Partners</span>
        </div>
        <div className="grid gap-px border-y sm:grid-cols-2 lg:grid-cols-4 rule">
          {PARTNERS.map((p) => {
            const inner = (
              <span className="flex h-44 flex-col items-center justify-center gap-3 px-6 text-center">
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${LOGO_BASE}/${p.logo}`}
                    alt={p.name}
                    className="max-h-20 w-auto max-w-[12rem]"
                    style={{ filter: "grayscale(1)", mixBlendMode: "multiply" }}
                    loading="lazy"
                  />
                ) : (
                  <span className="display text-2xl">{p.name}</span>
                )}
                {p.note && <span className="stamp">{p.note}</span>}
              </span>
            );
            return p.url ? (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="block transition-opacity hover:opacity-70"
              >
                {inner}
              </a>
            ) : (
              <div key={p.name}>{inner}</div>
            );
          })}
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--byd-mute)" }}>
          Team sponsors only.
        </p>
      </div>
    </section>
  );
}
