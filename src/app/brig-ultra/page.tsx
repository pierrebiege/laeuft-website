import { Fragment } from "react";
import Image from "next/image";
import { EVENT, STUNDE, STUNDEN, CHALLENGES, FINALE, RUNDE, WAHL, KENNZAHLEN, PARTNERBLOCK } from "./event";
import Anmeldung from "./Anmeldung";

/* Die Absenderzeile. Pierre steht zuerst — so hat er das Event angesagt —,
   das Studio gleich gross daneben. Es gehört beiden. */
function Absender() {
  return (
    <div className="von">
      <b>Pierre Biege</b>
      <span className="x">×</span>
      <Image
        src="/brig-ultra/stadtfitness-brig.png"
        alt="Stadtfitness Brig"
        width={2319}
        height={1136}
        priority
      />
    </div>
  );
}

/* Der Balken zeigt eine Stunde massstabsgetreu: die Breite jedes Felds
   entspricht seinen Minuten. Wer ihn einmal gesehen hat, muss den Ablauf
   nicht mehr lesen. */
function Stundenbalken() {
  return (
    <div
      className="hour-bar"
      role="img"
      aria-label="Eine Stunde, zweimal derselbe Ablauf: 20 Minuten Runde, 5 Minuten Challenge, 5 Minuten Pause."
    >
      {STUNDE.map((s, i) => (
        <div key={i} className="hour-seg" data-art={s.art} style={{ flex: `${s.min} 1 0` }}>
          <b>{s.min} min</b>
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
      "50 Kilometer in zehn Stunden durch Brig. Alle 30 Minuten eine Runde von 2,5 km, jede Stunde eine Challenge im Studio. Kostenlos, für alle, eine Runde reicht.",
    startDate: `${EVENT.datumISO}T${EVENT.start}:00+02:00`,
    endDate: `${EVENT.datumISO}T${EVENT.ende}:00+02:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    sport: "Ultramarathon",
    isAccessibleForFree: true,
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
      { "@type": "Person", name: "Pierre Biege", url: "https://laeuft.ch" },
      { "@type": "Organization", name: EVENT.partner.studio },
    ],
  };

  const band = ["50 km", "10 Stunden", "Eine Runde reicht", "Kostenlos"];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------------- Kopf ---------------- */}
      <section className="hero">
        <div className="wrap">
          <Absender />
          <h1>
            50<span className="km">km</span>
            <br />
            Brig
          </h1>
          <p className="hero-gattung">{EVENT.gattung}</p>
          <p className="hero-claim">
            {EVENT.claim}
            <br />
            <span className="cu">{EVENT.claimZwei}</span>
          </p>
          <p className="hero-datum">
            {EVENT.datum} · {EVENT.start}–{EVENT.ende} Uhr · {EVENT.treffpunkt}, {EVENT.ort}
          </p>
          <p className="hero-cta">
            <a className="cta" href="#anmelden">
              Kostenlos anmelden
            </a>
          </p>
          <p className="cta-note">Eine Runde reicht. Zuschauen auch.</p>
        </div>
      </section>

      {/* ---------------- Laufband ---------------- */}
      <div className="marquee">
        <div className="marquee-track" aria-hidden="true">
          {[...band, ...band, ...band, ...band].map((t, i) => (
            <span key={i}>{t} ·</span>
          ))}
        </div>
      </div>

      {/* ---------------- Worum es geht ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Worum es geht</p>
          <h2>
            Kein Rennen.
            <br />
            Ein Tag.
          </h2>
          <div className="zweispalt">
            <div>
              <p>
                Wir laufen am 4. Oktober 50 Kilometer. Nicht am Stück und nicht
                allein — aufgeteilt auf zehn Stunden, mit allen, die vorbeikommen.
              </p>
              <p>
                Alle 30 Minuten startet vor dem Stadtfitness eine Runde von
                2,5 Kilometern. Danach eine kurze Challenge im Studio, dann
                Pause, dann die nächste Runde. Zwanzigmal so. Um 18 Uhr sind
                50 Kilometer zusammengekommen.
              </p>
              <p>
                Du musst keine Läuferin sein und keinen Marathon hinter dir
                haben. Du musst nicht mal die ganze Zeit bleiben. Komm am
                Morgen, komm am Mittag, komm für eine Runde.
              </p>
            </div>
            <ul className="zahlen-block">
              {KENNZAHLEN.map((k) => (
                <li key={k.wert}>
                  <b>{k.wert}</b>
                  <span>{k.was}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- Die Wahl ---------------- */}
      <section className="band" data-ton="hell">
        <div className="wrap">
          <p className="stamp">Vier Arten mitzumachen</p>
          <h2>
            Du sagst,
            <br />
            wie weit.
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
          <p className="nachsatz">
            Alle vier zählen gleich viel. Wer eine Runde mitläuft, war dabei.
          </p>
        </div>
      </section>

      {/* ---------------- Die Stunde ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">So läuft eine Stunde</p>
          <h2>
            Jede halbe Stunde
            <br />
            dasselbe.
          </h2>
          <Stundenbalken />
          <ul className="takt">
            <li>
              <b>:00</b>
              <span>Runde · 2,5 km</span>
            </li>
            <li>
              <b>:20</b>
              <span>Challenge im Studio</span>
            </li>
            <li>
              <b>:30</b>
              <span>Runde · 2,5 km</span>
            </li>
            <li>
              <b>:50</b>
              <span>Challenge im Studio</span>
            </li>
          </ul>
          <p className="nachsatz">
            Gestartet wird zur vollen und zur halben Stunde. Zwanzigmal an
            diesem Tag. Wer eine Runde auslässt, steigt einfach beim nächsten
            Start wieder ein.
          </p>
        </div>
      </section>

      {/* ---------------- Die Runde ---------------- */}
      <section className="band" data-ton="hell">
        <div className="wrap">
          <p className="stamp">Die Runde</p>
          <h2>
            Wir laufen
            <br />
            durch Brig.
          </h2>
          <ul className="kette">
            {RUNDE.stationen.map((s, i) => (
              <li key={i} data-pfeil={i < RUNDE.stationen.length - 1 ? "" : undefined}>
                {s}
              </li>
            ))}
          </ul>
          <dl className="zahlen">
            <div>
              <dt>Länge</dt>
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
              <dt>Pro Stunde</dt>
              <dd>2 ×</dd>
            </div>
          </dl>
          <p className="nachsatz">
            Start und Ziel sind im Studio. Nach jeder Runde bist du wieder
            drin — deine Tasche bleibt liegen. Acht Minuten pro Kilometer ist
            ein Tempo, bei dem du dich nebenher unterhalten kannst.
          </p>
        </div>
      </section>

      {/* ---------------- Challenges ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Zehn Challenges, zweimal durch</p>
          <h2>
            Der Teil
            <br />
            im Studio.
          </h2>
          <p className="lead">
            Nach jeder Runde eine. Kein Material, alle machen gleichzeitig mit.
          </p>
          <ol className="chal">
            {CHALLENGES.map((c) => (
              <li key={c.nr} data-leicht={"leicht" in c ? "" : undefined}>
                <span className="nr tnum">{String(c.nr).padStart(2, "0")}</span>
                <h3>{c.titel}</h3>
                <span className="dosis">{c.dosis}</span>
                <span className="teil">{c.teil}</span>
              </li>
            ))}
          </ol>
          <p className="nachsatz">
            Nach der zehnten fängt die Liste wieder von vorne an. Nur Rumpf,
            Arme und Schultern — nie die Beine. Die müssen zehn Stunden lang
            laufen.
          </p>
          <div className="finale">
            <p className="stamp">Der zwanzigste Block, 17:50 Uhr</p>
            <h3>{FINALE.titel}</h3>
            <p>{FINALE.dosis}</p>
            <p className="finale-zahl">{FINALE.teil}</p>
          </div>
        </div>
      </section>

      {/* ---------------- Der Tag ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Der ganze Tag</p>
          <h2>Acht bis achtzehn.</h2>
          <table className="plan">
            <tbody>
              {STUNDEN.map((s) => (
                <Fragment key={s.nr}>
                  {/* Die Kilometer stehen für den Stand am Ende dieser Stunde —
                      die letzte Zeile ist deshalb schon das Ziel. */}
                  <tr className={s.nr === STUNDEN.length ? "schluss" : undefined}>
                    <td className="zeit">{s.von}</td>
                    <td className="tat">
                      {s.challenges.map((c) => c.titel).join(" · ")}
                    </td>
                    <td className="km tnum">{s.km} km</td>
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
          <p className="nachsatz">
            Die Kilometer sind der Stand am Ende der Stunde. Ab 13 Uhr läuft
            die Challenge-Liste ein zweites Mal durch. Die letzte Runde startet
            um 17:30, um 18 Uhr stehen alle zusammen vor dem Studio.
          </p>
        </div>
      </section>

      {/* ---------------- Der Ultra ---------------- */}
      <section className="band" data-ton="hell">
        <div className="wrap">
          <p className="stamp">Falls du den ganzen Tag bleibst</p>
          <h2>
            Ein Marathon hört
            <br />
            bei 42<span className="cu">,</span>195 auf.
          </h2>
          <p className="lead">
            Du läufst fünfzig. Alles darüber heisst Ultramarathon — und dafür
            brauchst du keinen Marathon davor.
          </p>
          <p className="nachsatz">
            Die meisten, die das an diesem Tag schaffen, haben vorher noch nie
            mehr als zehn Kilometer am Stück gemacht. Das geht, weil zwischen
            den Runden immer eine Pause liegt und nie mehr als 2,5 Kilometer
            vor dir.
          </p>
        </div>
      </section>

      {/* ---------------- Pierre ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Wer neben dir läuft</p>
          <h2>
            Lauf mit
            <br />
            Pierre.
          </h2>
          <div className="pierre">
            <div>
              <p>Pierre Biege läuft jeden Tag. Er wohnt in Albinen.</p>
              <p>
                Sein längster Lauf am Stück: 33 Stunden. Dreizehn Tage nach
                diesem Sonntag startet er für Team Schweiz an der
                Backyard-Ultra-WM.
              </p>
              <p>
                Am 4. Oktober läuft er zehn Stunden durch Brig — neben dir. Du
                kannst ihn die ganze Runde lang alles fragen, was du über das
                Laufen wissen willst. Oder einfach mitlaufen und nichts sagen.
              </p>
            </div>
            <ul className="vita">
              <li>
                <b>33 Stunden</b>
                <span>längster Lauf am Stück</span>
              </li>
              <li>
                <b>Jeden Tag</b>
                <span>seit Jahren</span>
              </li>
              <li>
                <b>17. Oktober</b>
                <span>Backyard-WM, Team Schweiz</span>
              </li>
              <li>
                <b>Albinen VS</b>
                <span>zuhause im Wallis</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- Praktisches ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Praktisches</p>
          <h2>Wo und womit.</h2>
          <ul className="rows">
            <li>
              <b>Datum</b> <span>{EVENT.datum}</span>
            </li>
            <li>
              <b>Zeit</b>
              <span>
                {EVENT.start} bis {EVENT.ende} Uhr
              </span>
            </li>
            <li>
              <b>Treffpunkt</b>
              <span>
                {EVENT.treffpunkt}, {EVENT.ort}
              </span>
            </li>
            <li>
              <b>Startgeld</b> <span className="frei">{EVENT.preis}</span>
            </li>
            <li>
              <b>Mitbringen</b> <span>Laufschuhe, Wechselshirt, Trinkflasche</span>
            </li>
            <li>
              <b>Garderobe</b> <span>im Studio, Tasche bleibt liegen</span>
            </li>
            <li>
              <b>Zuschauen</b> <span>jederzeit, kostet nichts</span>
            </li>
            <li>
              <b>Kinder</b> <span>dürfen mitlaufen, in Begleitung</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------------- DRYLL ---------------- */}
      <section className="band">
        <div className="wrap">
          <p className="stamp">Am Rand der Strecke</p>
          <h2>
            {EVENT.partner.marke}
            <br />
            Release.
          </h2>
          <p className="lead">
            Erstmals im Wallis. Danach im Regal des {EVENT.partner.studio}.
          </p>
        </div>
      </section>

      {/* ---------------- Anmeldung ---------------- */}
      <Anmeldung />

      {/* ---------------- Die zwei dahinter ---------------- */}
      {/* Steht bewusst nach der Anmeldung: wer sich eingetragen hat, ist
          genau die Person, für die beide Angebote gemacht sind. */}
      <section className="band" data-ton="hell">
        <div className="wrap">
          <p className="stamp">Die zwei hinter dem Tag</p>
          <h2>
            Und danach?
          </h2>
          <ul className="partner">
            {PARTNERBLOCK.map((pt) => (
              <li key={pt.name}>
                <span className="kicker">{pt.kicker}</span>
                <h3>{pt.name}</h3>
                <p>{pt.satz}</p>
                <ul className="partner-fakten">
                  {pt.fakten.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a href={pt.link} target="_blank" rel="noopener">
                  {pt.linkText}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <p className="schlusszeile">{EVENT.schluss}</p>
          <Absender />
          <p>
            {EVENT.nameLaut} · {EVENT.datumKurz} · {EVENT.ort}, Wallis ·{" "}
            <a href="https://laeuft.ch">laeuft.ch</a>
          </p>
        </div>
      </footer>
    </>
  );
}
