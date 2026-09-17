"use client";

import { useState } from "react";
import { EVENT, WAHL } from "./event";

/* Die Anmeldung. Bewusst wenige Felder und kein Konto: Name, E-Mail, wie
   lange. Das Formular schickt an /api/brig-ultra/anmeldung — die Route legt
   die Anmeldung in Supabase ab, meldet sie Pierre und bestätigt dem Anmelder.

   Jede Person meldet sich einzeln an. Es gibt bewusst kein «wir kommen zu
   dritt»-Feld: eine Anmeldung ist eine Adresse, und die Adressen sind das,
   was nach dem Tag übrig bleibt. Wer zu mehreren kommt, schreibt es ins
   freie Feld. */

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
        <p className="stamp">Anmeldung</p>
        <h2>
          Sag einfach,
          <br />
          dass du kommst.
        </h2>
        <p className="lead">
          Kostenlos, zwei Felder. Eine Woche vorher bekommst du eine Mail mit
          allem, was du wissen musst.
        </p>

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
            <label className="feld">
              <span>Name</span>
              <input type="text" name="name" required autoComplete="name" placeholder="Vor- und Nachname" />
            </label>

            <label className="feld">
              <span>E-Mail</span>
              <input type="email" name="email" required autoComplete="email" placeholder="du@beispiel.ch" />
            </label>

            <label className="feld">
              <span>Wie viel nimmst du dir vor?</span>
              <select name="umfang" defaultValue={UMFANG[0]}>
                {UMFANG.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="Weiss ich noch nicht">Weiss ich noch nicht</option>
              </select>
            </label>

            <label className="feld feld-breit">
              <span>
                Etwas, das wir wissen sollten? <i>Freiwillig</i>
              </span>
              <textarea
                name="notiz"
                rows={3}
                placeholder="Komme zu zweit, Kinderwagen dabei, erste Laufschuhe seit zehn Jahren …"
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
