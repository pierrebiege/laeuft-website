import { PARTNERS, LOGO_BASE } from "@/app/backyard/_data/event";

/**
 * Der Hauptsponsor bekommt eine richtige Sektion: Logo in Originalfarben
 * auf weisser Karte mit Schatten, daneben der Dank. Darunter die offene
 * Zeile für weitere Partner. Nur echte Team-Sponsoren.
 */
export default function Partners() {
  if (!PARTNERS.length) return null;
  const [main, ...rest] = PARTNERS;

  return (
    <section data-hour="tag" data-stamp="Partners" className="px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-[76rem]">
        <div className="mb-12 border-b pb-4 rule">
          <span className="stamp">Partners</span>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <a
            href={main.url}
            target="_blank"
            rel="noreferrer"
            className="block bg-white p-10 transition-transform duration-300 hover:scale-[1.015] sm:p-16"
            style={{ boxShadow: "0 30px 70px -35px rgba(11, 11, 11, 0.4)" }}
          >
            {main.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${LOGO_BASE}/${main.logo}`}
                alt={main.name}
                className="mx-auto h-auto w-full max-w-[26rem]"
                loading="lazy"
              />
            )}
          </a>

          <div>
            <p className="stamp mb-4">Main partner</p>
            <h2 className="display text-[2rem] sm:text-4xl">Thank you, {main.name}.</h2>
            {main.note && (
              <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
                {main.note}
              </p>
            )}
            {main.url && (
              <a
                href={main.url}
                target="_blank"
                rel="noreferrer"
                className="stamp mt-8 inline-block underline underline-offset-4"
              >
                {main.url.replace(/^https?:\/\/(www\.)?/, "")} ↗
              </a>
            )}
          </div>
        </div>

        {rest.length > 0 && (
          <div className="mt-16 grid gap-px border-y sm:grid-cols-3 lg:grid-cols-4 rule">
            {rest.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-28 items-center justify-center px-6 transition-opacity hover:opacity-70"
              >
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${LOGO_BASE}/${p.logo}`} alt={p.name} className="max-h-12 w-auto" loading="lazy" />
                ) : (
                  <span className="display text-xl">{p.name}</span>
                )}
              </a>
            ))}
          </div>
        )}

        <div className="mt-16 grid items-baseline gap-4 border-t pt-8 sm:grid-cols-[12rem_1fr] rule">
          <p className="stamp">Become a partner</p>
          <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            The team is grateful for any support on its longest day of the year.
            Want to be part of race day in Baar? Talk to the team.
          </p>
        </div>
      </div>
    </section>
  );
}
