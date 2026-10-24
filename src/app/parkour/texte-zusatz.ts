/* Zusätzliche Textbausteine für die Gestaltung (Zähler, Bildunterschriften,
   Formular-Hinweise). Die Haupttexte stehen in texte.ts. */

import type { Sprache } from "./texte";
import type { Kapitel } from "./Doku";

type Zusatz = {
  zahlen: { jahre: string; orte: string; abstimmung: string; abstimmungDatum: string };
  karte: { orte: (n: number) => string };
  hero: { bild: string };
  wir: { ort: Record<"ramon" | "pierre", string> };
  mitmachen: { schnell: string; pflicht: string };
  doku: {
    tvKasten: string;
    tvZeile: string;
    kapitelTitel: string;
    kapitel: Kapitel[];
    eckTitel: string;
    sasFrage: string;
    sasLinks: string;
    sasRechts: string;
    sasSchnitt: string;
  };
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
    doku: {
      tvKasten: "Münsingen, um 2000",
      tvZeile: "Ein paar Sekunden auf ARTE: Einer springt über ein Geländer. Roger geht raus und probiert es.",
      kapitelTitel: "Der Film in Kapiteln",
      kapitel: [
        { nummer: "Prolog", jahre: "heute", titel: "Zwei Generationen", text: "Einer über 40 und eine Jugendliche springen dieselbe Linie. Dann die erste Frage." },
        { nummer: "Kapitel 1", jahre: "1997–2004", titel: "Der Funke", text: "Fernsehbilder aus Frankreich, der Film «Yamakasi», die ersten Sprünge in Münsingen." },
        { nummer: "Kapitel 2", jahre: "2005–2009", titel: "Die Crews", text: "Foren, erste Websites und Videos, Crews in allen Landesteilen, Reisen nach Frankreich." },
        { nummer: "Kapitel 3", jahre: "2006–2015", titel: "Vom Hobby zum Beruf", text: "Werbejobs, Shows, erste Firmen und Vereine. Wer davon leben will, und wer das falsch findet." },
        { nummer: "Kapitel 4", jahre: "2009–2016", titel: "Jams und eigene Räume", text: "Der First Swiss Jam in Basel, eigene Parks und eine Halle, die nie gebaut wird." },
        { nummer: "Kapitel 5", jahre: "2017–2022", titel: "Wem gehört Parkour?", text: "Der Weltturnverband will Parkour, die Szene gründet ihren eigenen Verband. Beide Seiten kommen zu Wort." },
        { nummer: "Kapitel 6", jahre: "2019–2026", titel: "Die Neuen", text: "Wettkämpfe, Titel, Hallen. Eine Generation, die Parkour als Sport kennengelernt hat." },
        { nummer: "Kapitel 7", jahre: "Herbst 2026", titel: "Offenes Ende", text: "Swiss Olympic stimmt ab. Alt und Jung trainieren am selben Spot." },
      ],
      eckTitel: "Eckdaten",
      sasFrage: "Wann hast du zum ersten Mal Parkour gesehen?",
      sasLinks: "Angefangen um 2000",
      sasRechts: "Angefangen 2023",
      sasSchnitt: "Schnitt",
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
    doku: {
      tvKasten: "Münsingen, vers 2000",
      tvZeile: "Quelques secondes sur ARTE : quelqu’un saute par-dessus une barrière. Roger sort et essaie.",
      kapitelTitel: "Le film en chapitres",
      kapitel: [
        { nummer: "Prologue", jahre: "aujourd’hui", titel: "Deux générations", text: "Un quadragénaire et une ado sautent la même ligne. Puis la première question." },
        { nummer: "Chapitre 1", jahre: "1997–2004", titel: "L’étincelle", text: "Des images de la télé française, le film « Yamakasi », les premiers sauts à Münsingen." },
        { nummer: "Chapitre 2", jahre: "2005–2009", titel: "Les crews", text: "Les forums, les premiers sites et vidéos, des crews dans toutes les régions, des voyages en France." },
        { nummer: "Chapitre 3", jahre: "2006–2015", titel: "Du hobby au métier", text: "Pubs, shows, premières entreprises et associations. Ceux qui veulent en vivre, et ceux qui trouvent ça faux." },
        { nummer: "Chapitre 4", jahre: "2009–2016", titel: "Jams et lieux à soi", text: "Le First Swiss Jam à Bâle, des parcs à soi et une salle qui ne sera jamais construite." },
        { nummer: "Chapitre 5", jahre: "2017–2022", titel: "À qui appartient le parkour ?", text: "La fédération internationale de gymnastique veut le parkour, la scène fonde sa propre fédération. Les deux côtés ont la parole." },
        { nummer: "Chapitre 6", jahre: "2019–2026", titel: "Les nouveaux", text: "Compétitions, titres, salles. Une génération qui a connu le parkour comme un sport." },
        { nummer: "Chapitre 7", jahre: "automne 2026", titel: "Fin ouverte", text: "Swiss Olympic vote. Anciens et jeunes s’entraînent sur le même spot." },
      ],
      eckTitel: "En bref",
      sasFrage: "Quand as-tu vu du parkour pour la première fois ?",
      sasLinks: "A commencé vers 2000",
      sasRechts: "A commencé en 2023",
      sasSchnitt: "Coupe",
    },
  },
};
