/* 50 KM BRIG — alle harten Fakten an einer Stelle.
   Name, Datum, Zeiten, Challenges und der Anmeldeweg werden ausschliesslich
   hier gepflegt. Was noch offen ist, steht unten unter OFFEN. */

export const EVENT = {
  /* Der Name ist die Domain und umgekehrt. Man sagt ihn einmal im Video und
     der Zuhörer kann ihn tippen — deshalb keine zweite Wortmarke daneben. */
  name: "50 km Brig",
  nameLaut: "50 KM BRIG",
  gattung: "Ultra Community Run",
  domain: "50kmbrig.ch",

  /* Beide Zeilen stammen wörtlich aus Pierres Video. Der Claim verspricht
     nichts, er nimmt die Angst raus — das ist hier die ganze Arbeit. */
  claim: "Alleine vielleicht nicht.",
  claimZwei: "Zusammen ganz bestimmt.",
  schluss: "Ein richtig guter Tag.",

  absender: "Pierre × Stadtfitness",

  datum: "Sonntag, 4. Oktober 2026",
  datumKurz: "So 4.10.2026",
  datumISO: "2026-10-04",
  /* Die Zeile, die auf jedem seiner Bilder steht. Genau so, mit Pipes. */
  zeile: "04. Oktober 2026 | 08:00 – 18:00 | BRIG",

  start: "08:00",
  ende: "18:00",
  ort: "Brig-Glis",
  treffpunkt: "Stadtfitness Brig",

  preis: "kostenlos",

  partner: { studio: "Stadtfitness Brig", marke: "DRYLL" },

  /* Alles zu diesem Event läuft bei Pierre über Natural Athletics. */
  postfach: "pierre@natural-athletics.ch",
} as const;

/* Pierres Laufstreak.
   Er weiss die Zahl selbst nicht mehr auswendig, deshalb steht hier ein
   Anker statt einer Behauptung: sein Instagram-Post vom 31.07.2026 nennt
   «Laufentag 824». Daraus ergibt sich der 29.04.2024 als erster Tag — und
   damit jede spätere Zahl, ohne dass jemand nachzählen muss.
   ⚠️ Wenn Pierre eine andere Zahl kennt, hier den Anker korrigieren, nicht
   das Ergebnis. */
export const STREAK = {
  ankerTag: 824,
  ankerDatum: "2026-07-31",
} as const;

function tagAm(datumISO: string) {
  const tagMs = 86_400_000;
  const diff = (Date.parse(datumISO) - Date.parse(STREAK.ankerDatum)) / tagMs;
  return STREAK.ankerTag + Math.round(diff);
}

/* Der wievielte Lauftag der 4. Oktober ist. */
export const LAUFTAG_AM_EVENT = tagAm("2026-10-04");

/* Pierres Lettering, aus seinen eigenen Entwürfen exportiert: weisse Schrift
   auf Transparenz. Die Seite setzt sie auf Schwarz oder über Fotos. Sie
   ersetzt Überschriften — was er selbst gesetzt hat, wird nicht nachgebaut. */
export const LETTERING = {
  lockup: { src: "/brig-ultra/lockup-50km.png", w: 945, h: 389, alt: "50 KM — Ultra Community Run" },
  absender: {
    src: "/brig-ultra/lockup-pierre-x-stadtfitness.png",
    w: 885,
    h: 60,
    alt: "Pierre × Stadtfitness",
  },
  zehnStunden: { src: "/brig-ultra/wort-10stunden.png", w: 310, h: 45, alt: "10 Stunden" },
  fuenfundzwanzig: { src: "/brig-ultra/wort-25km.png", w: 232, h: 45, alt: "25 km" },
  eineRunde: {
    src: "/brig-ultra/wort-1runde.png",
    w: 240,
    h: 56,
    alt: "1 Runde oder 50 km — du entscheidest",
  },
} as const;

export const FOTO = {
  hero: { src: "/brig-ultra/brig-strasse-hoch.jpg", w: 1122, h: 1402 },
  strasse: { src: "/brig-ultra/brig-strasse-quer.jpg", w: 1536, h: 1024 },
  studio: { src: "/brig-ultra/studio-innen.jpg", w: 1672, h: 941 },
  pierre: { src: "/brig-ultra/pierre-selfie.jpg", w: 1024, h: 1536 },
} as const;

/* Die vier Zahlen des Tages. */
export const KENNZAHLEN = [
  { wert: "50", einheit: "km", was: "am Ende des Tages" },
  { wert: "10", einheit: "Stunden", was: "von 8 bis 18 Uhr" },
  { wert: "20", einheit: "Runden", was: "à 2,5 km" },
  { wert: "0", einheit: "Franken", was: "Startgeld" },
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

export const TAKT = [
  { zeit: ":00", was: "Runde · 2,5 km" },
  { zeit: ":20", was: "Challenge im Studio" },
  { zeit: ":30", was: "Runde · 2,5 km" },
  { zeit: ":50", was: "Challenge im Studio" },
] as const;

/* Die Runde durch Brig: 2,5 km, Start und Ziel im Studio. */
export const RUNDE = {
  km: "2,5 km",
  hm: "22 hm",
  tempo: "8 min/km",
  stationen: ["Stadtfitness", "Bahnhofstrasse", "Stockalpergarten", "Saltinadamm", "Stadtfitness"],
} as const;

/* Zehn Challenges, im Studio nach jeder Runde. Zwanzig Runden ergeben
   zwanzig Blöcke — die Liste läuft also zweimal durch. Der allerletzte Block
   ist keine Übung mehr, sondern das Gruppenfoto.
   Bewusst nur Rumpf, Arme und Schultern — nie die Beine: die müssen zehn
   Stunden lang laufen. Nummer zehn ist absichtlich die leichteste. */
export const CHALLENGES = [
  { nr: 1, titel: "Push-ups", dosis: "3 × 30 Sek." },
  { nr: 2, titel: "Plank", dosis: "3 × 30 Sek." },
  { nr: 3, titel: "Mountain Climbers", dosis: "3 × 30 Sek." },
  { nr: 4, titel: "Trizeps Push-ups", dosis: "30–45 Sek." },
  { nr: 5, titel: "Dead Bug", dosis: "2 × 45 Sek." },
  { nr: 6, titel: "Side Plank", dosis: "je Seite 30 Sek." },
  { nr: 7, titel: "Bear Hold", dosis: "3 × 30 Sek." },
  { nr: 8, titel: "Shoulder Taps", dosis: "3 × 30 Sek." },
  { nr: 9, titel: "Superman", dosis: "3 × 30 Sek." },
  { nr: 10, titel: "Armkreisen", dosis: "2 × 30 Sek.", leicht: true },
] as const;

/* Der zwanzigste und letzte Block, um 17:50. */
export const FINALE = {
  titel: "Gruppenfoto",
  dosis: "alle zusammen, Arme hoch",
  teil: "50 km · 10 Stunden · 1 Community",
} as const;

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
    km: (i + 1) * 5,
    challenges: [ABLAUF[i * 2].was, ABLAUF[i * 2 + 1].was],
  };
});

/* Vier Arten mitzumachen. Bewusst gleichwertig — sobald eine davon die
   «richtige» wäre, würden die anderen zum Trostpreis. Je eine Zeile: wer
   hier liest, will keine Erklärung, sondern seine Option finden. */
export const WAHL = [
  { was: "1 Runde", viel: "2,5 km", wer: "Vorbeikommen, mitlaufen, gehen." },
  { was: "1 Stunde", viel: "5 km", wer: "Der Ablauf einmal ganz." },
  { was: "Halber Tag", viel: "25 km", wer: "Morgen oder Nachmittag." },
  { was: "Alles", viel: "50 km", wer: "Am Abend hast du einen Ultra gelaufen." },
] as const;

/* Was man wissen muss, ohne Fliesstext. */
export const FAKTEN = [
  { was: "Datum", ist: EVENT.datum },
  { was: "Zeit", ist: `${EVENT.start}–${EVENT.ende} Uhr` },
  { was: "Treffpunkt", ist: `${EVENT.treffpunkt}, ${EVENT.ort}` },
  { was: "Startgeld", ist: "keines", frei: true },
  { was: "Mitbringen", ist: "Laufschuhe, Wechselshirt, Trinkflasche" },
  { was: "Garderobe", ist: "im Studio, Tasche bleibt liegen" },
  { was: "Zuschauen", ist: "jederzeit, kostet nichts" },
  { was: "Kinder", ist: "dürfen mitlaufen, in Begleitung" },
] as const;

/* Nach dem Tag. Beide sind Orte zum Weitertrainieren — das Stadtfitness ist
   nicht bloss die Kulisse, und Pierres eigene Schule steht gleichwertig
   daneben. */
export const WEITER = [
  {
    kicker: "Trainieren in Brig",
    name: "Stadtfitness Brig",
    satz: "Start und Ziel an diesem Tag — und danach dein Studio. 1000 m² mitten in Brig, rund um die Uhr offen.",
    fakten: ["Sennereigasse 8, 3900 Brig-Glis", "24 Stunden, 7 Tage", "Geräte, Kurse, Beratung"],
    link: "https://www.stadtfitness.ch",
    linkText: "stadtfitness.ch",
  },
  {
    kicker: "Trainieren mit Pierre",
    name: "Natural Athletics",
    satz: "Pierres Bewegungsschule in Brig. Laufen, klettern, Hindernisse überwinden — jede Woche, für Kinder, Jugendliche und Erwachsene.",
    fakten: ["Kids Mi 16.45 · Jugend Mi 18.25", "Erwachsene Do 09.00", "Coaches Pierre und Pascal"],
    link: "https://www.natural-athletics.ch",
    linkText: "natural-athletics.ch",
  },
] as const;

/* Die Fragen, die im Gym und in den Kommentaren wirklich gestellt werden.
   Sie stehen als FAQ-Abschnitt auf der Seite und gleichzeitig als
   FAQPage-Auszeichnung im Quelltext — Google zeigt sie dann direkt im
   Suchergebnis. Kurze Antworten, keine Werbesätze. */
export const FAQ = [
  {
    frage: "Muss ich die ganzen 50 Kilometer laufen?",
    antwort:
      "Nein. Du kannst eine einzige Runde von 2,5 Kilometern mitlaufen und wieder gehen. Die 50 Kilometer legen wir gemeinsam zurück, nicht jeder für sich.",
  },
  {
    frage: "Was kostet die Teilnahme?",
    antwort:
      "Nichts. Es gibt kein Startgeld und keine Verpflichtung. Zuschauen kostet ebenfalls nichts.",
  },
  {
    frage: "Brauche ich Lauferfahrung?",
    antwort:
      "Nein. Wir laufen acht Minuten pro Kilometer — ein Tempo, bei dem du dich nebenher unterhalten kannst. Zwischen den Runden liegt immer eine Pause.",
  },
  {
    frage: "Wann und wo startet es?",
    antwort:
      "Am Sonntag, 4. Oktober 2026, um 08:00 Uhr beim Stadtfitness Brig an der Sennereigasse 8 in Brig-Glis. Danach startet alle 30 Minuten eine neue Runde, die letzte um 17:30 Uhr.",
  },
  {
    frage: "Kann ich später dazukommen?",
    antwort:
      "Ja. Es startet alle 30 Minuten eine Runde. Komm am Morgen, am Mittag oder am Nachmittag — du steigst einfach beim nächsten Start ein.",
  },
  {
    frage: "Was sind die Challenges?",
    antwort:
      "Nach jeder Runde eine kurze Kraftübung im Studio, etwa Push-ups, Plank oder Mountain Climbers. Ohne Material, alle machen gleichzeitig mit. Nur Rumpf, Arme und Schultern, nie die Beine.",
  },
  {
    frage: "Dürfen Kinder mitlaufen?",
    antwort: "Ja, in Begleitung eines Erwachsenen. Eine Runde dauert rund zwanzig Minuten.",
  },
  {
    frage: "Was muss ich mitbringen?",
    antwort:
      "Laufschuhe, ein Wechselshirt und eine Trinkflasche. Deine Tasche kannst du im Studio liegen lassen, Start und Ziel sind dort.",
  },
] as const;

/* ---------------------------------------------------------------------------
   OFFEN — mit dem Stadtfitness bestätigen, bevor die Seite indexiert wird:
   · Teilnehmerzahl (gibt es eine Obergrenze?)
   · Ob Anmeldungen zusätzlich ans Studio gehen sollen
   · Umfang des DRYLL-Stands
   --------------------------------------------------------------------------- */
