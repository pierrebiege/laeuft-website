/* Zusätzliche Textbausteine für die Gestaltung (Zähler, Bildunterschriften,
   Formular-Hinweise). Die Haupttexte stehen in texte.ts. */

import type { Sprache } from "./texte";

type Zusatz = {
  zahlen: { jahre: string; orte: string; abstimmung: string; abstimmungDatum: string };
  karte: { orte: (n: number) => string };
  hero: { bild: string };
  wir: { ort: Record<"ramon" | "pierre", string> };
  mitmachen: { schnell: string; pflicht: string };
};

export const ZUSATZ: Record<Sprache, Zusatz> = {
  de: {
    zahlen: {
      jahre: "Jahre Parkour in der Schweiz",
      orte: "Orte, die wir schon belegen können",
      abstimmung: "Swiss Olympic stimmt über den Verband ab",
      abstimmungDatum: "20.11.",
    },
    karte: { orte: (n) => (n === 1 ? "1 Ort" : `${n} Orte`) },
    hero: { bild: "Die Schweiz mit allen Orten, die wir bis jetzt belegen können" },
    wir: { ort: { ramon: "Münsingen", pierre: "Oberwallis" } },
    mitmachen: {
      schnell: "Pflicht sind nur Name und Kontakt. Der Rest ist freiwillig.",
      pflicht: "Pflicht",
    },
  },
  fr: {
    zahlen: {
      jahre: "ans de parkour en Suisse",
      orte: "lieux dont on a déjà une trace",
      abstimmung: "Swiss Olympic vote sur la fédération",
      abstimmungDatum: "20.11.",
    },
    karte: { orte: (n) => (n === 1 ? "1 lieu" : `${n} lieux`) },
    hero: { bild: "La Suisse avec tous les lieux dont on a une trace jusqu’ici" },
    wir: { ort: { ramon: "Münsingen", pierre: "Haut-Valais" } },
    mitmachen: {
      schnell: "Seuls ton nom et un contact sont obligatoires. Le reste est facultatif.",
      pflicht: "Obligatoire",
    },
  },
};
