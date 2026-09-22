import type { Metadata } from "next";
import Link from "next/link";
import { EVENT } from "../event";

/* Impressum für 50 km Brig. Die Website gehört Pierre — sie läuft unter
   Natural Athletics, seiner Bewegungsschule. Das Stadtfitness ist Partner
   des Anlasses, aber nicht Herausgeber dieser Seite; deshalb steht es hier
   als Partner und nicht als Verantwortlicher. */

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
          Diese Website betreibt Pierre Biege. Den Anlass organisiert er
          zusammen mit dem Stadtfitness Brig.
        </p>

        <section>
          <h2>Verantwortlich für diese Website</h2>
          <p>
            <b>Natural Athletics — Pierre Biege</b>
            <br />
            Tschangaladongastrasse 3
            <br />
            3955 Albinen, Schweiz
            <br />
            <a href={`mailto:${EVENT.postfach}`}>{EVENT.postfach}</a>
            <br />
            <a href="https://www.natural-athletics.ch" target="_blank" rel="noopener">
              natural-athletics.ch
            </a>
          </p>
          <p>
            Inhalt, Gestaltung und Betrieb von {EVENT.domain} sowie die
            Anmeldung liegen bei ihm. Fragen zur Website und zur Anmeldung gehen
            an dieselbe Adresse.
          </p>
        </section>

        <section>
          <h2>Partner des Anlasses</h2>
          <p>
            <b>Stadtfitness Brig</b>, Sennereigasse 8, 3900 Brig-Glis —{" "}
            <a href="https://www.stadtfitness.ch" target="_blank" rel="noopener">
              stadtfitness.ch
            </a>
            . Das Studio stellt Start, Ziel und Garderobe, verschenkt die
            T-Shirts und organisiert den Tag mit. Für diese Website ist es nicht
            verantwortlich.
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
            Sachschäden, soweit das Gesetz das zulässt.
          </p>
          <p>
            Wer am Anlasstag unter 18 ist, nimmt nur mit dem Einverständnis
            eines Elternteils teil, das bei der Anmeldung bestätigt wird. Die
            Eltern bekommen eine Kopie der Anmeldung und sind am Tag als
            Notfallkontakt hinterlegt. Für Kinder, die mit Erwachsenen kommen,
            sind die begleitenden Erwachsenen verantwortlich.
          </p>
        </section>

        <section>
          <h2>Bilder</h2>
          <p>
            Die Aufnahmen aus dem Stadtfitness Brig stammen von Pierre Biege. Die Strassenansichten von Brig sind digital erzeugte
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
