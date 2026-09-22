import type { Metadata } from "next";
import Link from "next/link";
import { EVENT } from "../event";

/* Datenschutzerklärung für 50 km Brig.
   Sie beschreibt ausschliesslich, was auf dieser Seite und rund um diesen
   Anlass tatsächlich passiert — nicht mehr und nicht weniger. Wer die
   Anmeldung ändert, muss diesen Text mitändern; das ist der Preis dafür,
   dass er stimmt. */

export const metadata: Metadata = {
  title: "Datenschutz",
  description:
    "Wer die Anmeldedaten von 50 km Brig bearbeitet, wozu, wie lange und welche Rechte du hast.",
  alternates: { canonical: "/datenschutz" },
  robots: { index: true, follow: true },
};

const STUDIO_ADRESSE = "Sennereigasse 8, 3900 Brig-Glis";

export default function Datenschutz() {
  return (
    <main className="band rechts">
      <div className="wrap">
        <p className="stamp">
          <Link href="/">← {EVENT.nameLaut}</Link>
        </p>
        <h1>Datenschutz.</h1>
        <p className="lead">
          Kurz: Deine Anmeldung sehen Pierre Biege und das Stadtfitness Brig.
          Sonst niemand.
        </p>

        <section>
          <h2>Wer verantwortlich ist</h2>
          <p>
            <b>Natural Athletics — Pierre Biege</b>
            <br />
            Tschangaladongastrasse 3, 3955 Albinen, Schweiz
            <br />
            <a href={`mailto:${EVENT.postfach}`}>{EVENT.postfach}</a>
          </p>
          <p>
            Er betreibt diese Website und die Anmeldung. Das{" "}
            <b>Stadtfitness Brig</b>, {STUDIO_ADRESSE}, organisiert den Anlass
            mit und erhält die Anmeldedaten für die Vorbereitung — siehe unten.
          </p>
        </section>

        <section>
          <h2>Welche Daten wir erheben</h2>
          <p>Über das Anmeldeformular:</p>
          <ul>
            <li>
              <b>Vorname und Name</b> — damit wir wissen, wer kommt
            </li>
            <li>
              <b>E-Mail-Adresse</b> — für die Bestätigung und die Infos vorher
            </li>
            <li>
              <b>WhatsApp-Nummer</b> — für die Infos am Renntag selbst
            </li>
            <li>
              <b>T-Shirt-Grösse</b> — das Stadtfitness Brig verschenkt Shirts
            </li>
            <li>
              <b>Geplanter Umfang</b> — damit wir die Verpflegung und die Runden
              planen können
            </li>
            <li>
              <b>Notiz</b> — freiwillig, das einzige Feld ohne Pflicht
            </li>
            <li>
              <b>Ob du 18 oder älter bist</b> — wer jünger ist, nimmt nur mit
              Einverständnis der Eltern teil
            </li>
          </ul>
          <p>
            Bei Teilnehmenden unter 18 zusätzlich: <b>Alter</b>, <b>Name,
            Telefonnummer und E-Mail-Adresse eines Elternteils</b> sowie der
            Zeitpunkt, zu dem das Einverständnis bestätigt wurde. Die Nummer
            brauchen wir, um die Eltern am Anlasstag im Notfall zu erreichen;
            an die E-Mail-Adresse geht eine Kopie der Anmeldung. Für nichts
            anderes.
          </p>
          <p>
            Beim Absenden bestätigst du mit einem Häkchen, dass wir diese
            Angaben dafür verwenden dürfen. Den Zeitpunkt dieser Bestätigung
            speichern wir mit.
          </p>
          <p>
            Technisch speichern wir zusätzlich den Zeitpunkt der Anmeldung und
            einen <b>Hashwert deiner IP-Adresse</b>. Der Hash lässt sich nicht
            in die Adresse zurückrechnen; er dient nur dazu, massenhaft
            eingetragene Falschanmeldungen zu erkennen.
          </p>
        </section>

        <section>
          <h2>Wozu wir sie verwenden</h2>
          <ul>
            <li>Um den Anlass zu organisieren und dich vorher zu informieren</li>
            <li>
              Damit das Stadtfitness Brig weiss, wie viele T-Shirts es in
              welcher Grösse braucht — die Shirts sind ein Geschenk des Studios
            </li>
            <li>
              Um dich am Renntag über WhatsApp zu erreichen, wenn sich etwas
              kurzfristig ändert
            </li>
            <li>
              Um dich später zu fragen, ob du bei einer Neuauflage wieder dabei
              sein willst
            </li>
          </ul>
          <p>
            Die Anmeldeliste geht an das Stadtfitness Brig, weil das Studio den
            Anlass mitorganisiert und die Shirts verschenkt. Darüber hinaus
            geben wir nichts weiter und verkaufen keine Adressen.
          </p>
        </section>

        <section>
          <h2>Wie lange wir sie behalten</h2>
          <p>
            Bis du widersprichst. Eine Mail an{" "}
            <a href={`mailto:${EVENT.postfach}`}>{EVENT.postfach}</a> mit dem
            Wort «löschen» genügt, wir brauchen keine Begründung. Danach ist
            dein Eintrag weg, spätestens innerhalb von 30 Tagen.
          </p>
        </section>

        <section>
          <h2>Wer die Daten technisch bearbeitet</h2>
          <p>
            Wir betreiben nichts davon selbst. Diese Dienstleister verarbeiten
            die Daten in unserem Auftrag:
          </p>
          <ul>
            <li>
              <b>Supabase</b> — die Datenbank mit den Anmeldungen. Serverstandort
              Irland (EU).
            </li>
            <li>
              <b>Hostpoint AG</b>, Rapperswil-Jona — der Mailversand der
              Bestätigung. Serverstandort Schweiz.
            </li>
            <li>
              <b>Vercel Inc.</b> — der Betrieb dieser Website. Die Auslieferung
              erfolgt über Server in Europa; das Unternehmen sitzt in den USA.
            </li>
          </ul>
        </section>

        <section>
          <h2>Website, Cookies, Statistik</h2>
          <p>
            Diese Seite setzt <b>keine Cookies</b> und blendet keine Werbung
            ein. Für die Reichweitenmessung läuft «Vercel Analytics» mit: es
            zählt Seitenaufrufe, ohne Cookies zu setzen und ohne Besucher über
            Websites hinweg wiederzuerkennen. Wie bei jedem Webserver fallen
            technische Protokolle an (IP-Adresse, Zeitpunkt, Browser), die
            automatisch gelöscht werden.
          </p>
        </section>

        <section>
          <h2>Fotos und Videos am Anlass</h2>
          <p>
            Am 4. Oktober fotografieren und filmen wir — unter anderem für das
            gemeinsame Gruppenfoto am Schluss. Diese Aufnahmen verwenden wir auf
            den Kanälen von Pierre Biege und des Stadtfitness Brig.
          </p>
          <p>
            Wenn du nicht auf Bildern erscheinen möchtest, sag es uns vor Ort
            oder vorher per Mail. Wir halten uns daran, und wenn dir ein
            veröffentlichtes Bild nicht passt, nehmen wir es herunter.
          </p>
        </section>

        <section>
          <h2>Deine Rechte</h2>
          <p>
            Nach dem Schweizer Datenschutzgesetz kannst du Auskunft verlangen,
            Daten berichtigen oder löschen lassen und der Bearbeitung
            widersprechen. Schreib an{" "}
            <a href={`mailto:${EVENT.postfach}`}>{EVENT.postfach}</a> — du
            bekommst innert 30 Tagen eine Antwort. Wenn dir unsere Antwort nicht
            genügt, kannst du dich an den Eidgenössischen Datenschutz- und
            Öffentlichkeitsbeauftragten (EDÖB) wenden.
          </p>
        </section>

        <p className="rechts-stand">Stand: 18. September 2026</p>

        <p className="rechts-zurueck">
          <Link className="cta" href="/#anmelden">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </main>
  );
}
