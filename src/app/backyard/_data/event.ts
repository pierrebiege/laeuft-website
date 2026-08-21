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
  { pos: 8, first: "Doron", name: "De Wolf", status: "atlarge", qual: 33, pb: 33 },
  { pos: 9, first: "Pierre", name: "Biege", status: "atlarge", qual: 33, pb: 33 },
  { pos: 10, first: "Julian", name: "Schneckenburger", status: "atlarge", qual: 32, pb: 32 },
  { pos: 11, first: "Andrea", name: "Pestoni", status: "atlarge", qual: 32, pb: 32 },
  { pos: 12, first: "Francois", name: "Gervaix", status: "atlarge", qual: 30, pb: 30 },
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

export const STAFF = [
  {
    name: "Jan Bruhnsen",
    role: "Race Director",
    does: ["Organisation und Infrastruktur", "Regeln durchsetzen", "Sicherheit der Athleten"],
  },
  {
    name: "Christian Pötzsch",
    role: "Co-Race Director",
    does: ["Alles, was Jan nicht schafft"],
  },
  {
    name: "Carsten Drilling",
    role: "Team Manager",
    does: ["Masseur", "Psychotherapeut", "Koch", "Coach"],
  },
  {
    name: "Nima Javaheri",
    role: "Team Captain",
    does: ["Motivationsredner", "Organisiert die Trainings", "Support für die Läufer"],
  },
] as const;

/** Team-Schweiz-Ergebnisse der bisherigen Team-WMs (Runden total). */
export const HISTORY = [
  { year: 2020, ch: 373, at: 368, de: 457 },
  { year: 2022, ch: 360, at: 358, de: 484 },
  { year: 2024, ch: 501, at: 407, de: 542 },
] as const;

/** Weltrekord-Kontext 2024 */
export const WORLD_2024 = {
  gold: { nation: "Belgien", yards: 1147, note: "alle 15 Läufer durch 48 Stunden – Weltrekord" },
  silver: { nation: "Australien" },
  bronze: { nation: "USA" },
} as const;

export const RULES = {
  scoring: [
    "Jede beendete Runde einer Person = 1 Punkt.",
    "Das Land mit den meisten Punkten gewinnt.",
    "Je länger wir mit vollem Team laufen, desto mehr Punkte.",
  ],
  backyard: [
    "Zum Glockenschlag müssen alle im Corral stehen.",
    "Alle starten mit der Glocke. Kein verspäteter Start.",
    "Ausser für die Toilette darf die Strecke während einer Runde nicht verlassen werden.",
    "Niemand ausserhalb des Rennens darf mitlaufen – auch ausgeschiedene Läufer nicht.",
    "Was du auf die Runde mitnimmst, bringst du zurück. Kleider, Flaschen, Geschirr, alles.",
    "Keine persönliche Hilfe während einer Runde.",
    "Rundenzeiten selber stoppen ist freiwillig.",
  ],
  teamwork: [
    "Wer die Startnummer vergisst: sag ihm, dass sie egal ist.",
    "Wer nicht mehr kann: lauf mit, hilf gehen. Auf der Strecke dürfen wir uns helfen – jede beendete Runde ist ein Punkt.",
    "Wer gepaced wird: schick den Pacer weg. Sonst droht die Disqualifikation.",
    "Wer die Stirnlampe vergisst: nimm ihn mit oder erinnere ihn ans Handy.",
  ],
} as const;

export const COURSE = {
  start: "Vereinshaus SV Baar",
  shape: "Out-and-back der Lorze entlang",
  surface: "Kies und Beton",
  elevation: "rund 30 Höhenmeter",
  crossings: [
    "Erste Querung ohne Zebrastreifen, wenig befahren.",
    "Zweite kurz vor Kilometer 2, mit Verkehrsinsel.",
  ],
  notes: ["Grösstenteils im Schatten", "Wendepunkt in der Mitte", "Wenig Platz – Crews teilen sich", "X-Bionic ist vor Ort"],
} as const;

/** Interne Termine – nicht öffentlich. */
export const SESSIONS = [
  { date: "26.08.2026", time: "18:00", what: "Witiker Backyard Course" },
  { date: "29.08.2026", time: "20:00", what: "Training auf der WM-Strecke in Baar" },
  { date: "09./10.09.2026", time: "", what: "Mit X-Bionic – noch zu bestätigen" },
  { date: "22.09.2026", time: "", what: "Training auf der WM-Strecke in Baar" },
] as const;
