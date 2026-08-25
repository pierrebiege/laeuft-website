// Alle harten Fakten zum Rennen an einem Ort.
// Quelle: «Team Schweiz Briefing» (Stand 19.08.2026) + bigsbackyardultra.com

export const EVENT = {
  name: "Backyard Ultra World Team Championship",
  nation: "Schweiz",
  /** Startschuss: 17.10.2026, 14:00 Uhr MESZ (= 12:00 UTC) */
  startISO: "2026-10-17T14:00:00+02:00",
  venue: "Vereinshaus SV Baar",
  town: "Baar",
  canton: "ZG",
  loopMeters: 6706,
  loopYards: "1 Yard = 6,7056 km",
  teamSize: 15,
} as const;

export type Status = "silver" | "atlarge" | "reserve";

export type Athlete = {
  pos: number | null;
  name: string;
  first: string;
  status: Status;
  /** Dateiname unter PHOTO_BASE, ohne Endung. Fehlt das Bild, zeigt die Karte den Platzhalter. */
  photo?: string;
  /** beste Rundenzahl im Qualifikationsfenster 16.08.2024 – 15.08.2026 */
  qual: number;
  /** persönliche Bestleistung in Runden */
  pb: number;
  role?: string;
};

/**
 * Kader Stand 19.08.2026, zweite Fassung des Briefings.
 * Gegenüber der ersten Fassung: David Luterbacher ist nicht mehr dabei,
 * Sebastian Kopp ist von der Reserve auf Position 15 nachgerückt,
 * alle Positionen dahinter sind neu nummeriert.
 */
export const TEAM: Athlete[] = [
  { pos: 1, first: "Nima", name: "Javaheri", status: "silver", qual: 59, pb: 59, role: "Team Captain" },
  { pos: 2, first: "Matteo", name: "Tenchio", status: "atlarge", qual: 58, pb: 61 },
  { pos: 3, first: "Ismael", name: "Röthlisberger", status: "atlarge", qual: 40, pb: 40 },
  { pos: 4, first: "Marc", name: "Schneider", status: "atlarge", qual: 40, pb: 40 },
  { pos: 5, first: "Nicolas", name: "Lehmann", status: "atlarge", qual: 38, pb: 38 },
  { pos: 6, first: "Felix", name: "Stamm", status: "silver", qual: 37, pb: 37 },
  { pos: 7, first: "Mona", name: "Winter", status: "atlarge", qual: 35, pb: 35 },
  { pos: 8, first: "Doron", name: "De Wolf", status: "atlarge", qual: 33, pb: 33, photo: "dewolf" },
  { pos: 9, first: "Pierre", name: "Biege", status: "atlarge", qual: 33, pb: 33, photo: "biege" },
  { pos: 10, first: "Julian", name: "Schneckenburger", status: "atlarge", qual: 32, pb: 32 },
  { pos: 11, first: "Andrea", name: "Pestoni", status: "atlarge", qual: 32, pb: 32 },
  { pos: 12, first: "Francois", name: "Gervaix", status: "atlarge", qual: 30, pb: 30, photo: "gervaix" },
  { pos: 13, first: "Daniel", name: "Schwitter", status: "atlarge", qual: 30, pb: 30 },
  { pos: 14, first: "Jörg", name: "Desteffani", status: "atlarge", qual: 30, pb: 30 },
  { pos: 15, first: "Sebastian", name: "Kopp", status: "atlarge", qual: 30, pb: 30 },
];

/**
 * Die zweite Fassung des Briefings führt keine Reserve mehr auf.
 * Bleibt leer, bis wieder eine veröffentlicht wird – lieber keine Namen
 * als alte Namen.
 */
export const RESERVE: Athlete[] = [];

/**
 * Wo die Porträts liegen. Dateiname = Nachname klein, ohne Umlaute, .jpg.
 * Beispiel: /squad/javaheri.jpg. Die Karten greifen automatisch darauf zu.
 */
export const PHOTO_BASE = "/backyard/squad";

export const slug = (a: Athlete) =>
  a.name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/[^a-z]/g, "");

/**
 * Team-Schweiz-Einzelresultate der bisherigen Team-WMs, aus dem Briefing
 * (Folie «Individual Goal»). Nachname, Runden.
 */
export const WTC_RESULTS: Record<2020 | 2022 | 2024, { name: string; laps: number }[]> = {
  2024: [
    { name: "Javaheri", laps: 59 }, { name: "Tenchio", laps: 58 }, { name: "Lehmann", laps: 38 },
    { name: "Briner", laps: 34 }, { name: "Hormann", laps: 34 }, { name: "Schneider", laps: 33 },
    { name: "Stamm", laps: 32 }, { name: "Schneckenburger", laps: 31 }, { name: "Knoche", laps: 30 },
    { name: "Desteffani", laps: 30 }, { name: "Schwitter", laps: 30 }, { name: "Drilling", laps: 25 },
    { name: "Vetterli", laps: 26 }, { name: "Kopp", laps: 24 }, { name: "Nonorgue", laps: 17 },
  ],
  2022: [
    { name: "Javaheri", laps: 35 }, { name: "Desteffani", laps: 34 }, { name: "Erne", laps: 33 },
    { name: "Drilling", laps: 32 }, { name: "Knoche", laps: 29 }, { name: "Schumacher", laps: 28 },
    { name: "Knusel", laps: 24 }, { name: "Weilenmann", laps: 24 }, { name: "Shepherd", laps: 22 },
    { name: "Rubin", laps: 21 }, { name: "Vetterli", laps: 20 }, { name: "Kohler", laps: 20 },
    { name: "Treptow", laps: 14 }, { name: "Buchler", laps: 13 }, { name: "Muller", laps: 11 },
  ],
  2020: [
    { name: "Sjöblom", laps: 32 }, { name: "Dippacher", laps: 31 }, { name: "Brennwald", laps: 30 },
    { name: "Bühler", laps: 29 }, { name: "Knüsel", laps: 28 }, { name: "Knapp", laps: 28 },
    { name: "Evers", laps: 27 }, { name: "Ambrosini", laps: 26 }, { name: "Winkler", laps: 25 },
    { name: "Stimpfle", laps: 24 }, { name: "Knoche", laps: 24 }, { name: "Förster", laps: 22 },
    { name: "Schmid", laps: 18 }, { name: "Kaufmann", laps: 18 }, { name: "Stolba", laps: 11 },
  ],
};

/** Frühere Team-WM-Resultate eines Läufers aus dem aktuellen Kader. */
export function pastResults(a: Athlete): { year: 2020 | 2022 | 2024; laps: number }[] {
  return ([2020, 2022, 2024] as const)
    .map((y) => ({ year: y, hit: WTC_RESULTS[y].find((r) => r.name === a.name) }))
    .filter((x): x is { year: 2020 | 2022 | 2024; hit: { name: string; laps: number } } => Boolean(x.hit))
    .map((x) => ({ year: x.year, laps: x.hit.laps }));
}

/** Resultat 2024 an jeder Position, absteigend sortiert – der Massstab «beat previous position's best». */
export const BENCH_2024 = [...WTC_RESULTS[2024]].map((r) => r.laps).sort((a, b) => b - a);


export const STAFF = [
  {
    name: "Jan Bruhnsen",
    role: "Race Director",
    does: ["Organisation and infrastructure", "Enforcing rules", "Athlete safety"],
  },
  {
    name: "Christian Pötzsch",
    role: "Co-Race Director",
    does: ["Whatever Jan can't do"],
  },
  {
    name: "Carsten Drilling",
    role: "Team Manager",
    does: ["Masseur", "Psychotherapist", "Chef", "Coach"],
  },
  {
    name: "Nima Javaheri",
    role: "Team Captain",
    does: ["Motivational speaker", "Arranges training", "Runners support"],
  },
] as const;

/** Team-Schweiz-Ergebnisse der bisherigen Team-WMs (Runden total). */
export const HISTORY = [
  { year: 2020, ch: 373, at: 368, de: 457 },
  { year: 2022, ch: 360, at: 358, de: 484 },
  { year: 2024, ch: 501, at: 407, de: 542 },
] as const;

export const WORLD_2024 = {
  gold: { nation: "Belgium", yards: 1147, note: "all fifteen through 48 hours, world record" },
  silver: { nation: "Australia" },
  bronze: { nation: "USA" },
} as const;

/** Wortlaut aus dem Briefing, unverändert. */
export const RULES = {
  scoring: [
    "Each person completing one loop scores one point.",
    "The country with the most points wins.",
    "The longer we run with a full team, the more points we score.",
  ],
  backyard: [
    "Participants must be inside the corral at the bell.",
    "All competitors must start at the bell. No late starts.",
    "Except for restroom breaks a competitor cannot leave the course until the yard is complete.",
    "No non-competitors may accompany active entrants on the course, including eliminated runners.",
    "Whatever you bring with you on the loop, you have to return with. Clothes, flasks, crockery, everything.",
    "No personal aid during a yard.",
    "Keeping lap times is optional.",
  ],
  teamwork: [
    "When someone forgets their bib, remind them it is not important.",
    "When someone can't continue, help them walk. We are allowed to help each other on the course, and each person completing one loop is one point.",
    "When it appears someone gets paced, send the pacer away. Remind them the runner can get disqualified.",
    "When someone forgets their headlamp, offer them to run with you or remind them they can use their phone.",
  ],
} as const;

export const COURSE = {
  start: "Vereinshaus SV Baar",
  shape: "Out and back along the Lorze",
  surface: "Gravel and concrete",
  elevation: "About 30 metres",
  crossings: [
    "The first has no zebra crossing and is a less used street.",
    "The second is just before 2 km and has an island.",
  ],
  notes: [
    "Mostly shaded",
    "Turn around at a Wendepunkt",
    "Limited space, crews are shared",
    "X-Bionic will be there to help",
  ],
} as const;

/**
 * Links für den Renntag. Sobald die Zeitmessung für Baar 2026 und ein
 * Livestream existieren, hier eintragen – die Seite blendet sie dann ein.
 */
/**
 * Team-Partner. Nur echte Sponsoren des Teams, keine offene Werbung.
 * Logo als /partners/<slug>.svg oder .png ablegen und hier eintragen –
 * ohne Logodatei zeigt die Zeile den Namen als Wortmarke.
 * Was ein Partner bekommt (Logo, Link, Zeile), entscheidet das Team.
 */
export const LOGO_BASE = "/backyard/partners";

export const PARTNERS: { name: string; url?: string; logo?: string; note?: string }[] = [
  {
    name: "X-Bionic",
    url: "https://www.x-bionic.com",
    logo: "x-bionic.svg",
    note: "X-Bionic Switzerland backs the team and will be on site in Baar on race day.",
  },
];

export const RACE_DAY = {
  timing: null as string | null,
  youtube: null as string | null,
  bigs: "https://bigsbackyardultra.com/world-team-championship-2026/",
} as const;

/** Interne Termine – nicht öffentlich. */
export const SESSIONS = [
  { date: "26.08.2026", time: "18:00", what: "Witiker Backyard Course" },
  { date: "29.08.2026", time: "20:00", what: "Training auf der WM-Strecke in Baar" },
  { date: "09./10.09.2026", time: "", what: "Mit X-Bionic – noch zu bestätigen" },
  { date: "22.09.2026", time: "", what: "Training auf der WM-Strecke in Baar" },
] as const;
