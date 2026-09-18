"use client";

import { useState } from "react";
import Link from "next/link";
import { EVENT, WAHL, SHIRTS } from "./event";

/* Die Anmeldung. Das Formular schickt an /api/brig-ultra/anmeldung — die
   Route legt die Anmeldung in Supabase ab, meldet sie Pierre und bestätigt
   dem Anmelder.

   Jede Person meldet sich einzeln an. Es gibt bewusst kein «wir kommen zu
   dritt»-Feld: eine Anmeldung ist eine Adresse, und die Adressen sind das,
   was nach dem Tag übrig bleibt.

   Bis auf die Notiz wird alles gebraucht: die Nummer für die Infos am
   Renntag, die Shirtgrösse für das Geschenk des Stadtfitness, der Umfang für
   die Planung. Statt Felder als freiwillig zu markieren, steht über ihnen,
   wozu sie dienen — eine Frage, deren Zweck man sieht, schreckt weniger ab
   als eine, die man für Datensammelei hält. */

const UMFANG = WAHL.map((w) => w.was);

export default function Anmeldung() {
  const [status, setStatus] = useState<"bereit" | "sendet" | "fertig" | "fehler">("bereit");
  const [meldung, setMeldung] = useState("");

  async function absenden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sendet") return;
    setStatus("sendet");
    setMeldung("");

    const daten = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const antwort = await fetch("/api/brig-ultra/anmeldung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(daten),
      });
      const ergebnis = await antwort.json().catch(() => ({}));
      if (!antwort.ok) throw new Error(ergebnis.error || "Das hat nicht geklappt.");
      setStatus("fertig");
    } catch (fehler) {
      setStatus("fehler");
      setMeldung(fehler instanceof Error ? fehler.message : "Das hat nicht geklappt.");
    }
  }

  return (
    <section className="band anmeldung" id="anmelden">
      <div className="wrap">
        <p className="stamp">Anmeldung · kostenlos</p>
        <h2>
          Sag einfach,
          <br />
          dass du kommst.
        </h2>
        <p className="lead">Fünf Felder, eine Minute. Dann bist du dabei.</p>

        {status === "fertig" ? (
          <div className="danke" role="status">
            <p className="danke-gross">Du bist dabei.</p>
            <p>
              Wir sehen uns am {EVENT.datum} beim {EVENT.treffpunkt}. Die
              Bestätigung ist unterwegs — schau zur Sicherheit auch im Spam nach.
            </p>
          </div>
        ) : (
          <form className="formular" onSubmit={absenden}>
            <label className="feld feld-halb">
              <span>Vorname</span>
              <input type="text" name="vorname" required autoComplete="given-name" placeholder="Pierre" />
            </label>

            <label className="feld feld-halb">
              <span>Name</span>
              <input type="text" name="nachname" required autoComplete="family-name" placeholder="Biege" />
            </label>

            <label className="feld feld-breit">
              <span>E-Mail</span>
              <input type="email" name="email" required autoComplete="email" placeholder="du@beispiel.ch" />
            </label>

            {/* Die Zeile begründet die nächsten Felder, bevor jemand sie
                zählt: wer den Zweck sieht, füllt sie aus. */}
            <p className="feld-trenner">
              Das brauchen wir für die Organisation
            </p>

            <label className="feld">
              <span>
                WhatsApp-Nummer <i>hier kommen die Infos am Renntag</i>
              </span>
              <input
                type="tel"
                name="telefon"
                required
                autoComplete="tel"
                inputMode="tel"
                placeholder="079 000 00 00"
              />
            </label>

            <label className="feld">
              <span>
                T-Shirt-Grösse <i>dein Shirt vom Stadtfitness</i>
              </span>
              <select name="shirt" required defaultValue="">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {SHIRTS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="Kein Shirt">Ich brauche keins</option>
              </select>
            </label>

            <label className="feld">
              <span>
                Wie viel nimmst du dir vor? <i>nur zur Planung, nicht verbindlich</i>
              </span>
              <select name="umfang" defaultValue="Weiss ich noch nicht">
                <option value="Weiss ich noch nicht">Weiss ich noch nicht</option>
                {UMFANG.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>

            <label className="feld">
              <span>
                Sonst noch etwas? <i>freiwillig, ein Satz genügt</i>
              </span>
              <input
                type="text"
                name="notiz"
                placeholder="Komme zu zweit, Kinderwagen dabei …"
              />
            </label>

            {/* Spamfalle: für Menschen unsichtbar, Bots füllen sie aus. */}
            <div className="honig" aria-hidden="true">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {/* Das Häkchen statt eines Hinweises am Rand: die Angaben gehen
                an zwei Stellen, und wer zustimmt, soll das auch getan haben.
                Der Zeitpunkt wird mitgespeichert. */}
            <label className="haken">
              <input type="checkbox" name="einwilligung" required value="ja" />
              <span>
                Ich bin einverstanden, dass Pierre Biege und das Stadtfitness
                Brig meine Angaben für die Organisation dieses Anlasses
                verwenden und mich dazu kontaktieren.{" "}
                <Link href="/datenschutz">Datenschutz</Link>
              </span>
            </label>

            <div className="formular-fuss">
              <button className="cta" type="submit" disabled={status === "sendet"}>
                {status === "sendet" ? "Moment …" : "Ich bin dabei"}
              </button>
              <p className="cta-note">
                Kein Startgeld, keine Verpflichtung. Kommt ihr zu mehreren,
                meldet sich jede Person einzeln an.
              </p>
            </div>

            {status === "fehler" && (
              <p className="fehler" role="alert">
                {meldung} Schreib uns sonst direkt an{" "}
                <a href={`mailto:${EVENT.postfach}?subject=Anmeldung%2050%20km%20Brig`}>{EVENT.postfach}</a>.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
