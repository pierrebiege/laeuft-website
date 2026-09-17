import { Fragment } from "react";
import Image from "next/image";
import {
  EVENT,
  LETTERING,
  FOTO,
  STUNDE,
  TAKT,
  STUNDEN,
  CHALLENGES,
  FINALE,
  RUNDE,
  WAHL,
  KENNZAHLEN,
  FAKTEN,
  WEITER,
  FAQ,
  LAUFTAG_AM_EVENT,
} from "./event";
import Anmeldung from "./Anmeldung";

/* Pierres Lettering statt einer nachgebauten Überschrift. Es steht immer auf
   Schwarz oder über einem abgedunkelten Foto, deshalb reicht das PNG mit
   Alpha — eine Webfont-Annäherung wäre nur eine schlechtere Kopie. */
function Wort({
  bild,
  className,
  priority,
}: {
  bild: { src: string; w: number; h: number; alt: string };
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      className={className}
      src={bild.src}
      alt={bild.alt}
      width={bild.w}
      height={bild.h}
      priority={priority}
    />
  );
}

/* Der Balken zeigt eine halbe Stunde massstabsgetreu. Wer ihn einmal gesehen
   hat, muss den Ablauf nicht mehr lesen. */
function Stundenbalken() {
  return (
    <div
      className="hour-bar"
      role="img"
      aria-label="Eine Stunde, zweimal derselbe Ablauf: 20 Minuten Runde, 5 Minuten Challenge, 5 Minuten Pause."
    >
      {STUNDE.map((s, i) => (
        <div key={i} className="hour-seg" data-art={s.art} style={{ flex: `${s.min} 1 0` }}>
          <b>{s.min}</b>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function BrigUltraPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: EVENT.nameLaut,
    description:
      "50 Kilometer in zehn Stunden durch Brig. Alle 30 Minuten eine Runde von 2,5 km, dazwischen eine Challenge im Studio. Kostenlos, für alle — eine Runde reicht.",
    startDate: `${EVENT.datumISO}T${EVENT.start}:00+02:00`,
    endDate: `${EVENT.datumISO}T${EVENT.ende}:00+02:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    sport: "Ultramarathon",
    isAccessibleForFree: true,
    image: [`https://${EVENT.domain}${FOTO.strasse.src}`],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CHF",
      availability: "https://schema.org/InStock",
      url: `https://${EVENT.domain}/`,
    },
    location: {
      "@type": "Place",
      name: EVENT.treffpunkt,
      address: { "@type": "PostalAddress", addressLocality: EVENT.ort, addressCountry: "CH" },
    },
    organizer: [
      {
        "@type": "Person",
        name: "Pierre Biege",
        url: "https://www.natural-athletics.ch",
        sameAs: ["https://www.instagram.com/pierrebiege/", "https://laeuft.ch"],
      },
      { "@type": "Organization", name: EVENT.partner.studio },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.frage,
      acceptedAnswer: { "@type": "Answer", text: f.antwort },
    })),
  };

  const band = ["50 km", "10 Stunden", "Eine Runde reicht", "Kostenlos"];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* ---------------- Kopf: das Bild trägt, nicht der Text ---------------- */}
      <header className="hero">
        <Image
          className="hero-foto"
          src={FOTO.hero.src}
          alt="Zwei Läufer auf der Bahnhofstrasse in Brig, im Hintergrund die Berge"
          width={FOTO.hero.w}
          height={FOTO.hero.h}
          priority
          sizes="100vw"
        />
        <div className="hero-inhalt wrap">
          <Wort bild={LETTERING.absender} className="hero-absender" priority />
          <Wort bild={LETTERING.lockup} className="hero-lockup" priority />
          <p className="hero-zeile">{EVENT.zeile}</p>
          <p className="hero-cta">
            <a className="cta" href="#anmelden">
              Kostenlos anmelden
            </a>
          </p>
          <p className="hero-klein">Eine Runde reicht.</p>
        </div>
      </header>

      {/* ---------------- Laufband ---------------- */}
      <div className="marquee">
        <div className="marquee-track" aria-hidden="true">
          {[...band, ...band, ...band, ...band].map((t, i) => (
            <span key={i}>{t} —</span>
          ))}
        </div>
      </div>

      {/* ---------------- Die vier Zahlen ---------------- */}
      <section className="band band-eng">
        <div className="wrap">
          <ul className="zahlen-reihe">
            {KENNZAHLEN.map((k) => (
              <li key={k.einheit}>
                <b>
                  {k.wert}
                  <i>{k.einheit}</i>
                </b>
                <span>{k.was}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Die Wahl ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Du entscheidest</p>
          <h2>
            1 Runde
            <br />
            oder 50 km.
          </h2>
          <ul className="wahl">
            {WAHL.map((w) => (
              <li key={w.was}>
                <span className="was">{w.was}</span>
                <span className="viel">{w.viel}</span>
                <span className="wer">{w.wer}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Bildband: die Strecke ---------------- */}
      <figure className="bildband">
        <Image
          src={FOTO.strasse.src}
          alt="Läufer auf dem Kopfsteinpflaster der Bahnhofstrasse Brig"
          width={FOTO.strasse.w}
          height={FOTO.strasse.h}
          sizes="100vw"
        />
        <figcaption>
          <b>2,5 km durch Brig.</b>
          <span>Zwanzigmal an diesem Tag.</span>
        </figcaption>
      </figure>

      {/* ---------------- Der Takt ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Jede halbe Stunde dasselbe</p>
          <h2>Der Takt.</h2>
          <Stundenbalken />
          <ul className="takt">
            {TAKT.map((t) => (
              <li key={t.zeit}>
                <b>{t.zeit}</b>
                <span>{t.was}</span>
              </li>
            ))}
          </ul>
          <dl className="zahlen">
            <div>
              <dt>Runde</dt>
              <dd>{RUNDE.km}</dd>
            </div>
            <div>
              <dt>Anstieg</dt>
              <dd>{RUNDE.hm}</dd>
            </div>
            <div>
              <dt>Tempo</dt>
              <dd>{RUNDE.tempo}</dd>
            </div>
            <div>
              <dt>Start</dt>
              <dd>:00 / :30</dd>
            </div>
          </dl>
          <ul className="kette">
            {RUNDE.stationen.map((s, i) => (
              <li key={i} data-pfeil={i < RUNDE.stationen.length - 1 ? "" : undefined}>
                {s}
              </li>
            ))}
          </ul>
          <p className="nachsatz">
            Acht Minuten pro Kilometer. Ein Tempo, bei dem du dich nebenher
            unterhalten kannst.
          </p>
        </div>
      </section>

      {/* ---------------- Bildband: das Studio ---------------- */}
      <figure className="bildband">
        <Image
          src={FOTO.studio.src}
          alt="Blick aus dem Stadtfitness Brig, zwei Läufer gehen zur Tür hinaus"
          width={FOTO.studio.w}
          height={FOTO.studio.h}
          sizes="100vw"
        />
        <figcaption>
          <b>Start, Ziel, Garderobe.</b>
          <span>Deine Tasche bleibt liegen.</span>
        </figcaption>
      </figure>

      {/* ---------------- Challenges ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Nach jeder Runde eine · zehn Stück, zweimal durch</p>
          <h2>Die Challenges.</h2>
          <ol className="chal">
            {CHALLENGES.map((c) => (
              <li key={c.nr} data-leicht={"leicht" in c ? "" : undefined}>
                <span className="nr tnum">{String(c.nr).padStart(2, "0")}</span>
                <h3>{c.titel}</h3>
                <span className="dosis">{c.dosis}</span>
              </li>
            ))}
          </ol>
          <p className="nachsatz">
            Kein Material, alle gleichzeitig. Nur Rumpf, Arme und Schultern —
            nie die Beine.
          </p>
          <div className="finale">
            <p className="stamp">Block 20 · 17:50 Uhr</p>
            <h3>{FINALE.titel}</h3>
            <p>{FINALE.dosis}</p>
            <p className="finale-zahl">{FINALE.teil}</p>
          </div>
        </div>
      </section>

      {/* ---------------- Der Tag ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Acht bis achtzehn</p>
          <h2>Der Tag.</h2>
          <table className="plan">
            <tbody>
              {STUNDEN.map((s) => (
                <Fragment key={s.nr}>
                  {/* Die Kilometer stehen für den Stand am Ende dieser Stunde —
                      die letzte Zeile ist deshalb schon das Ziel. */}
                  <tr className={s.nr === STUNDEN.length ? "schluss" : undefined}>
                    <td className="zeit">{s.von}</td>
                    <td className="tat">{s.challenges.map((c) => c.titel).join(" · ")}</td>
                    <td className="km tnum">{s.km}</td>
                  </tr>
                  {s.nr === 8 && (
                    <tr className="marker">
                      <td colSpan={3}>Ab hier ist es ein Ultra · mehr als 42,195 km</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------- Pierre ---------------- */}
      <section className="band band-pierre">
        <div className="wrap">
          <div className="pierre">
            <div className="pierre-bild">
              <Image
                src={FOTO.pierre.src}
                alt="Pierre Biege im Stadtfitness Brig"
                width={FOTO.pierre.w}
                height={FOTO.pierre.h}
                sizes="(min-width: 56rem) 40vw, 100vw"
              />
            </div>
            <div className="pierre-text">
              <p className="stamp">Wer das hier macht</p>
              <h2>
                Pierre
                <br />
                Biege.
              </h2>
              {/* Erste Person, weil er es selbst sagt. Kein Lebenslauf und
                  keine Leistungsschau — er ist der Initiator, nicht die
                  Hauptattraktion. */}
              <div className="pierre-wort">
                <p>
                  Ich wohne in Albinen und laufe jeden Tag. Am 4. Oktober ist
                  es Tag {LAUFTAG_AM_EVENT}.
                </p>
                <p>
                  Diesen Tag habe ich zusammen mit dem Stadtfitness Brig auf
                  die Beine gestellt, weil ich einmal nicht allein laufen
                  wollte.
                </p>
                <p>
                  Ich bin die ganzen zehn Stunden dabei. Frag mich alles oder
                  lauf einfach mit und sag nichts.
                </p>
              </div>
              <ul className="vita">
                <li>
                  <b>{LAUFTAG_AM_EVENT} Tage</b>
                  <span>jeden Tag gelaufen</span>
                </li>
                <li>
                  <b>40 Stunden</b>
                  <span>268 km — längster Lauf am Stück</span>
                </li>
              </ul>
              <p className="pierre-links">
                <span>Mehr von mir</span>
                <a href="https://www.instagram.com/pierrebiege/" target="_blank" rel="noopener">
                  Instagram
                </a>
                <a href="https://www.natural-athletics.ch" target="_blank" rel="noopener">
                  Natural Athletics
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Anmeldung ---------------- */}
      <Anmeldung />

      {/* ---------------- Praktisches ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Praktisches</p>
          <h2>Wo und womit.</h2>
          <ul className="rows">
            {FAKTEN.map((f) => (
              <li key={f.was}>
                <b>{f.was}</b>
                <span className={"frei" in f ? "frei" : undefined}>{f.ist}</span>
              </li>
            ))}
            <li>
              <b>Am Rand</b>
              <span>{EVENT.partner.marke} — Release im Wallis</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------------- Fragen ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Was am häufigsten gefragt wird</p>
          <h2>Fragen.</h2>
          <ul className="faq">
            {FAQ.map((f) => (
              <li key={f.frage}>
                <h3>{f.frage}</h3>
                <p>{f.antwort}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Weitertrainieren ---------------- */}
      {/* Steht nach der Anmeldung: wer sich eingetragen hat, ist genau die
          Person, für die beide Angebote gemacht sind. */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Und danach</p>
          <h2>Weitertrainieren.</h2>
          <ul className="weiter">
            {WEITER.map((w) => (
              <li key={w.name}>
                <span className="kicker">{w.kicker}</span>
                <h3>{w.name}</h3>
                <p>{w.satz}</p>
                <ul className="weiter-fakten">
                  {w.fakten.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a href={w.link} target="_blank" rel="noopener">
                  {w.linkText}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <p className="schlusszeile">
            {EVENT.claim}
            <br />
            {EVENT.claimZwei}
          </p>
          <Wort bild={LETTERING.absender} className="fuss-absender" />
          <p className="fuss-zeile">
            {EVENT.domain} · {EVENT.zeile}
          </p>
          <p className="fuss-klein">
            Ein Tag von Pierre Biege und dem {EVENT.partner.studio}. Fragen an{" "}
            <a href={`mailto:${EVENT.postfach}`}>{EVENT.postfach}</a>. {EVENT.schluss}
          </p>
        </div>
      </footer>
    </>
  );
}
