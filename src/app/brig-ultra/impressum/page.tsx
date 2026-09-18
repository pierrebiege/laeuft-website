import type { Metadata } from "next";
import Link from "next/link";
import { EVENT } from "../event";

/* Impressum für 50 km Brig. Der Anlass hat zwei Veranstalter, also stehen
   auch zwei drin — die Seite gehört beiden. */

export const metadata: Metadata = {
  title: "Impressum",
  description: "Wer hinter 50 km Brig steht und wer für diese Website verantwortlich ist.",
  alternates: { canonical: "/impressum" },
  robots: { index: true, follow: true },
};

export default function Impressum() {
  return (
    <main className="band rechts">
      <div className="wrap">
        <p className="stamp">
          <Link href="/">← {EVENT.nameLaut}</Link>
        </p>
        <h1>Impressum.</h1>
        <p className="lead">
          {EVENT.nameLaut} ist ein gemeinsamer Anlass von Pierre Biege und dem
          Stadtfitness Brig.
        </p>

        <section>
          <h2>Veranstalter</h2>
          <ul>
            <li>
              <b>Pierre Biege</b>
              <br />
              Tschangaladongastrasse 3
              <br />
              3955 Albinen, Schweiz
              <br />
              <a href={`mailto:${EVENT.postfach}`}>{EVENT.postfach}</a>
            </li>
            <li>
              <b>Stadtfitness Brig</b>
              <br />
              Sennereigasse 8
              <br />
              3900 Brig-Glis, Schweiz
              <br />
              <a href="mailto:info@stadtfitness.ch">info@stadtfitness.ch</a> ·{" "}
              <a href="https://www.stadtfitness.ch" target="_blank" rel="noopener">
                stadtfitness.ch
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2>Für diese Website</h2>
          <p>
            Inhalt, Gestaltung und Betrieb von {EVENT.domain}: Pierre Biege,
            Adresse wie oben. Anfragen zur Website und zur Anmeldung gehen an{" "}
            <a href={`mailto:${EVENT.postfach}`}>{EVENT.postfach}</a>.
          </p>
        </section>

        <section>
          <h2>Teilnahme auf eigene Verantwortung</h2>
          <p>
            {EVENT.nameLaut} ist kein Wettkampf, sondern ein gemeinsames
            Training auf öffentlich zugänglichen Wegen. Es gibt keine
            Zeitmessung, keine Rangliste und keinen abgesperrten Parcours. Der
            Verkehr läuft normal weiter, und die Strassenverkehrsregeln gelten
            für alle.
          </p>
          <p>
            Wer mitläuft, tut das auf eigene Verantwortung und schätzt selbst
            ein, wie viel er sich zumutet. Eine Unfallversicherung ist Sache der
            Teilnehmenden. Die Veranstalter haften nicht für Personen- oder
            Sachschäden, soweit das Gesetz das zulässt. Für Kinder sind die
            begleitenden Erwachsenen verantwortlich.
          </p>
        </section>

        <section>
          <h2>Bilder</h2>
          <p>
            Die Aufnahmen aus dem Stadtfitness Brig sowie das Porträt stammen von
            Pierre Biege. Die Strassenansichten von Brig sind digital erzeugte
            Darstellungen und zeigen keine tatsächliche Szene. Das Logo des
            Stadtfitness Brig gehört dem Studio und wird mit dessen Einverständnis
            verwendet.
          </p>
        </section>

        <section>
          <h2>Haftung für Inhalte und Links</h2>
          <p>
            Wir halten die Angaben auf dieser Seite aktuell, übernehmen aber
            keine Gewähr für Richtigkeit und Vollständigkeit. Für die Inhalte
            verlinkter Websites sind deren Betreiber verantwortlich.
          </p>
        </section>

        <section>
          <h2>Datenschutz</h2>
          <p>
            Was mit deiner Anmeldung passiert, steht in der{" "}
            <Link href="/datenschutz">Datenschutzerklärung</Link>.
          </p>
        </section>

        <p className="rechts-zurueck">
          <Link className="cta" href="/#anmelden">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </main>
  );
}
