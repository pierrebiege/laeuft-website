"use client";

import { useEffect, useState } from "react";
import { EVENT } from "./event";

/* Die mitlaufende Anmeldeleiste.
   Sie erscheint, sobald der Kopf weggescrollt ist, und verschwindet wieder,
   sobald das Formular selbst im Bild ist — sonst würde sie genau das
   verdecken, wozu sie auffordert. Auf dem Handy sitzt sie unten, am Rechner
   ebenfalls: dort ist der Daumen und dort stört sie den Text am wenigsten. */

export default function AnmeldeLeiste() {
  const [sichtbar, setSichtbar] = useState(false);

  useEffect(() => {
    const kopf = document.querySelector(".hero");
    const formular = document.querySelector("#anmelden");
    if (!kopf || !formular) return;

    /* Zwei Beobachter statt Scroll-Ereignissen: das kostet keine Rechenzeit
       beim Scrollen und bleibt auch bei Sprüngen (Anker, Zurück-Taste)
       korrekt. */
    const stand = { kopfDrin: true, formularDrin: false };

    const auswerten = () => setSichtbar(!stand.kopfDrin && !stand.formularDrin);

    const kopfBeobachter = new IntersectionObserver(
      ([e]) => {
        stand.kopfDrin = e.isIntersecting;
        auswerten();
      },
      { threshold: 0.15 }
    );

    const formularBeobachter = new IntersectionObserver(
      ([e]) => {
        stand.formularDrin = e.isIntersecting;
        auswerten();
      },
      { rootMargin: "-10% 0px -25% 0px" }
    );

    kopfBeobachter.observe(kopf);
    formularBeobachter.observe(formular);
    return () => {
      kopfBeobachter.disconnect();
      formularBeobachter.disconnect();
    };
  }, []);

  return (
    <div className="leiste" data-an={sichtbar ? "" : undefined} aria-hidden={!sichtbar}>
      <div className="leiste-inhalt">
        <p className="leiste-text">
          <b>{EVENT.datumKurz}</b>
          <span>
            {EVENT.start}–{EVENT.ende} Uhr · {EVENT.treffpunkt} · kostenlos
          </span>
        </p>
        <a className="cta" href="#anmelden" tabIndex={sichtbar ? undefined : -1}>
          Anmelden
        </a>
      </div>
    </div>
  );
}
