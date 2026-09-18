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

   Pflicht sind nur Name und E-Mail. Alles Weitere — Telefon, Shirtgrösse,
   Umfang, Notiz — steht unter einer eigenen Zwischenzeile als freiwillig
   markiert. Das ist der ganze Trick gegen die Abschreckung: nicht weniger
   fragen, sondern sichtbar machen, wie wenig man ausfüllen muss. */

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
        <p className="lead">Name und E-Mail genügen. Der Rest ist freiwillig.</p>

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

            {/* Ab hier ist nichts mehr Pflicht. Die Zeile sagt das, bevor
                jemand die Felder zählt und abspringt. */}
            <p className="feld-trenner">
              Ab hier freiwillig — hilft uns und dem Stadtfitness bei der Planung
            </p>

            <label className="feld">
              <span>
                WhatsApp-Nummer <i>für die Infos am Renntag</i>
              </span>
              <input
                type="tel"
                name="telefon"
                autoComplete="tel"
                inputMode="tel"
                placeholder="079 000 00 00"
              />
            </label>

            <label className="feld">
              <span>
                T-Shirt-Grösse <i>das Stadtfitness verschenkt Shirts</i>
              </span>
              <select name="shirt" defaultValue="">
                <option value="">Keine Angabe</option>
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
                Wie viel nimmst du dir vor? <i>kannst du jederzeit ändern</i>
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
                Sonst noch etwas? <i>ein Satz genügt</i>
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

            <div className="formular-fuss">
              <button className="cta" type="submit" disabled={status === "sendet"}>
                {status === "sendet" ? "Moment …" : "Ich bin dabei"}
              </button>
              <p className="cta-note">
                Kein Startgeld, keine Verpflichtung. Kommt ihr zu mehreren,
                meldet sich jede Person einzeln an. Deine Angaben sehen Pierre
                und das Stadtfitness Brig —{" "}
                <Link href="/datenschutz">Datenschutz</Link>.
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
