/* 50 KM BRIG — alle harten Fakten an einer Stelle.
   Name, Datum, Zeiten, Challenges und der Anmeldeweg werden ausschliesslich
   hier gepflegt. Was noch offen ist, steht unten unter OFFEN. */

export const EVENT = {
  /* Der Name ist die Domain und umgekehrt. Man sagt ihn einmal im Video und
     der Zuhörer kann ihn tippen — deshalb keine zweite Wortmarke daneben. */
  name: "50 km Brig",
  nameLaut: "50 KM BRIG",
  gattung: "Der Community-Ultra",
  domain: "50kmbrig.ch",

  /* Beide Zeilen stammen wörtlich aus Pierres Video. Der Claim verspricht
     nichts, er nimmt die Angst raus — das ist hier die ganze Arbeit. */
  claim: "Alleine vielleicht nicht.",
  claimZwei: "Zusammen ganz bestimmt.",
  schluss: "Ein richtig guter Tag.",

  /* Pierre zuerst: so hat er es angesagt. */
  absender: "Pierre × Stadtfitness",

  datum: "Sonntag, 4. Oktober 2026",
  datumKurz: "So 4.10.2026",
  datumISO: "2026-10-04",

  start: "08:00",
  ende: "18:00",
  ort: "Brig-Glis",
  treffpunkt: "Stadtfitness Brig",

  /* Kostenlos ist kein Rabatt, sondern die Aussage: das hier ist kein Rennen,
     sondern ein gemeinsames Training. Deshalb steht es gross auf der Seite. */
  preis: "kostenlos",

  partner: { studio: "Stadtfitness Brig", marke: "DRYLL" },

  /* Alles zu diesem Event läuft bei Pierre über Natural Athletics — das ist
     die Adresse, die auf der Seite steht und an die Anmeldungen gehen. */
  postfach: "pierre@natural-athletics.ch",
} as const;

/* Die beiden, die hinter dem Tag stehen. Der Block steht ganz unten: wer bis
   dahin gelesen hat, ist die Person, für die beide Angebote gemacht sind.
   Deshalb konkrete Angaben statt Werbesätzen. */
export const PARTNERBLOCK = [
  {
    kicker: "Der Ort",
    name: "Stadtfitness Brig",
    satz: "Start, Ziel und Garderobe an diesem Tag. 1000 m² im Herzen von Brig, rund um die Uhr offen.",
    fakten: ["Sennereigasse 8, 3900 Brig-Glis", "24 Stunden, 7 Tage", "Kurse für Anfang bis Fortgeschritten"],
    link: "https://www.stadtfitness.ch",
    linkText: "stadtfitness.ch",
  },
  {
    kicker: "Weitertrainieren",
    name: "Natural Athletics",
    satz: "Pierres Bewegungsschule in Brig. Wenn dir der Tag gefallen hat, geht es hier jede Woche weiter.",
    fakten: ["Kids Mi 16.45 · Jugend Mi 18.25", "Erwachsene Do 09.00", "Coaches Pierre und Pascal"],
    link: "https://www.natural-athletics.ch",
    linkText: "natural-athletics.ch",
  },
] as const;

/* Die Zahlen, die im Laufband und im Vorschaubild laufen. */
export const KENNZAHLEN = [
  { wert: "50 km", was: "am Ende des Tages" },
  { wert: "10 Stunden", was: "von 8 bis 18 Uhr" },
  { wert: "20 Runden", was: "à 2,5 km" },
  { wert: "20 Challenges", was: "zehn, zweimal durch" },
  { wert: "0 Franken", was: "Startgeld" },
] as const;

/* Eine Stunde, in Minuten. Summe = 60.
   Jede halbe Stunde ist gleich gebaut: Runde, Challenge, Pause. Wer den
   Rhythmus einmal mitgemacht hat, kennt den ganzen Tag. */
export const STUNDE = [
  { min: 20, art: "lauf", label: "Runde", detail: "2,5 km" },
  { min: 5, art: "kraft", label: "Challenge", detail: "im Studio" },
  { min: 5, art: "pause", label: "Pause", detail: "" },
  { min: 20, art: "lauf", label: "Runde", detail: "2,5 km" },
  { min: 5, art: "kraft", label: "Challenge", detail: "im Studio" },
  { min: 5, art: "pause", label: "Pause", detail: "" },
] as const;

/* Die Runde durch Brig: 2,5 km, Start und Ziel im Studio.
   Zweimal pro Stunde gelaufen ergibt das die 5 Kilometer. */
export const RUNDE = {
  km: "2,5 km",
  hm: "22 hm",
  belag: "50 % Asphalt",
  tempo: "8 min/km",
  stationen: ["Stadtfitness", "Bahnhofstrasse", "Stockalpergarten", "Saltinadamm", "Stadtfitness"],
} as const;

/* Zehn Challenges, im Studio nach jeder Runde. Zwanzig Runden ergeben
   zwanzig Blöcke — die Liste läuft also zweimal durch. Der allerletzte Block
   ist keine Übung mehr, sondern das Gruppenfoto.
   Bewusst nur Rumpf, Arme und Schultern — nie die Beine: die müssen zehn
   Stunden lang laufen. Kein Material, alle gleichzeitig, jede unter fünf
   Minuten. Nummer zehn ist absichtlich die leichteste: sie sitzt am Ende
   des Durchgangs, wenn die Arme schon müde sind. */
export const CHALLENGES = [
  { nr: 1, titel: "Push-ups", dosis: "3 × 30 Sek.", teil: "Brust · Arme" },
  { nr: 2, titel: "Plank", dosis: "3 × 30 Sek.", teil: "Rumpf" },
  { nr: 3, titel: "Mountain Climbers", dosis: "3 × 30 Sek.", teil: "Rumpf · Puls" },
  { nr: 4, titel: "Trizeps Push-ups", dosis: "30–45 Sek.", teil: "Arme" },
  { nr: 5, titel: "Dead Bug", dosis: "2 × 45 Sek.", teil: "Rumpf" },
  { nr: 6, titel: "Side Plank", dosis: "je Seite 30 Sek.", teil: "Rumpf seitlich" },
  { nr: 7, titel: "Bear Hold", dosis: "3 × 30 Sek.", teil: "Rumpf · Schultern" },
  { nr: 8, titel: "Shoulder Taps", dosis: "3 × 30 Sek.", teil: "Schultern" },
  { nr: 9, titel: "Superman", dosis: "3 × 30 Sek.", teil: "Rücken" },
  { nr: 10, titel: "Armkreisen", dosis: "2 × 30 Sek., vor und zurück", teil: "Lockern", leicht: true },
] as const;

/* Der zwanzigste und letzte Block. Er ersetzt im zweiten Durchgang die
   zehnte Übung — um 17:50, wenn die 50 Kilometer voll sind. */
export const FINALE = {
  titel: "Gruppenfoto",
  dosis: "alle zusammen, Arme hoch",
  teil: "50 km · 10 Stunden · 1 Community",
} as const;

/* Die zwanzig Blöcke des Tages in der Reihenfolge, in der sie drankommen. */
export const ABLAUF = Array.from({ length: 20 }, (_, i) => ({
  block: i + 1,
  durchgang: i < 10 ? 1 : 2,
  was: i === 19 ? FINALE : CHALLENGES[i % 10],
}));

/* Zehn Stunden, kumulierte Kilometer, je zwei Challenges. */
export const STUNDEN = Array.from({ length: 10 }, (_, i) => {
  const h = Number(EVENT.start.slice(0, 2)) + i;
  const hh = String(h).padStart(2, "0");
  return {
    nr: i + 1,
    von: `${hh}:00`,
    zweiterStart: `${hh}:30`,
    km: (i + 1) * 5,
    challenges: [ABLAUF[i * 2].was, ABLAUF[i * 2 + 1].was],
  };
});

/* Vier Arten mitzumachen. Bewusst gleichwertig formuliert — sobald eine
   davon die «richtige» wäre, würden die anderen zum Trostpreis. */
export const WAHL = [
  { was: "Eine Runde", viel: "2,5 km · 20 Minuten", wer: "Du kommst vorbei, läufst einmal mit, gehst wieder." },
  { was: "Eine Stunde", viel: "5 km · 1 Challenge", wer: "Der ganze Ablauf einmal durch." },
  { was: "Ein halber Tag", viel: "25 km · 5 Stunden", wer: "Morgen oder Nachmittag. Beides reicht." },
  { was: "Alles", viel: "50 km · 10 Stunden", wer: "Am Abend hast du einen Ultramarathon gelaufen." },
] as const;

/* ---------------------------------------------------------------------------
   OFFEN — mit dem Stadtfitness bestätigen, bevor die Seite indexiert wird:
   · Teilnehmerzahl (gibt es eine Obergrenze?)
   · Ob Anmeldungen zusätzlich ans Studio gehen sollen
   · Umfang des DRYLL-Stands
   --------------------------------------------------------------------------- */
