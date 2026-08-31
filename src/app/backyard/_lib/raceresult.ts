/**
 * Adapter für die öffentliche race|result-API.
 *
 * Jede Nation der Team-WM timet ihr Satelliten-Rennen selbst – fast alle mit
 * race|result, aber jede mit eigenen Listennamen. Deshalb entdecken wir die
 * Struktur zur Laufzeit über /data/config und suchen uns die passende
 * Ergebnisliste selbst.
 *
 * Wichtig: der Pfad /{event}/RRPublish/data/list antwortet mit 301 auf
 * /{event}/results/list – wir sprechen direkt das Ziel an.
 */

const BASE = "https://my.raceresult.com";

export type RRConfig = {
  key: string;
  eventname: string;
  contests: Record<string, string>;
  lists: { Name: string; Live?: number }[];
  EventOver?: boolean;
};

export type Runner = {
  rank: number;
  name: string;
  first: string;
  last: string;
  nat: string | null;
  club: string | null;
  laps: number;
  km: number | null;
  time: string | null;
  pace: string | null;
};

export type NationLive = {
  slug: string;
  nation: string;
  eventId: string;
  eventName: string;
  listName: string;
  over: boolean;
  runners: Runner[];
  laps: number;
  yards: number;
  standing: number;
  currentLap: number;
  fetchedAt: string;
};

async function rr<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`race|result ${res.status} für ${path}`);
  return (await res.json()) as T;
}

export function getConfig(eventId: string, revalidate = 300) {
  return rr<RRConfig>(`/${eventId}/RRPublish/data/config?page=results&noVisitor=1`, revalidate);
}

/**
 * Bevorzugt eine Live-Rangliste. Detail-Listen (eine Zeile je Runde) sind
 * für den Gesamtstand unbrauchbar und fliegen raus.
 *
 * Ist das Rennen vorbei, ist die Endliste die richtige – nicht die
 * Live-Fassung. Belgien 2024 heisst «Online|Final» und «Online|Final LIVE»;
 * ohne diese Unterscheidung greift man nach dem Rennen ins Leere.
 */
export function pickList(cfg: RRConfig): string | null {
  const usable = (cfg.lists ?? []).filter((l) => !/detail|split/i.test(l.Name));
  if (!usable.length) return null;
  const over = Boolean(cfg.EventOver);
  const final = usable.find((l) => /final|result|ergebnis/i.test(l.Name) && !/live/i.test(l.Name));
  const live = usable.find((l) => /live/i.test(l.Name) || l.Live === 1);
  return ((over ? final ?? live : live ?? final) ?? usable[0]).Name;
}

type RawList = {
  list: { Fields?: { Label: string }[] };
  data: Record<string, unknown[][]> | unknown[][];
};

const idx = (labels: string[], re: RegExp) => labels.findIndex((l) => re.test(l));

/**
 * Die Rundenspalte sicher finden. Listen enthalten oft mehrere Spalten mit
 * «Lap» im Namen – «Last Lap», «Avg Lap», «Fast Lap» sind aber Zeiten, keine
 * Rundenzahlen. Erst exakt suchen, dann vorsichtig fuzzy, und nur ganze Zahlen
 * in plausibler Grösse akzeptieren.
 */
export function lapsIndex(labels: string[]): number {
  const exact = labels.findIndex((l) => /^\s*(laps|runden|yards|rounds|loops)\s*$/i.test(l));
  if (exact >= 0) return exact;
  return labels.findIndex(
    (l) => /lap|runde|yard|loop/i.test(l) && !/last|slow|fast|avg|average|best|pb|split|time|zeit|pace|hour/i.test(l),
  );
}

function toRunner(row: unknown[], labels: string[]): Runner | null {
  // row = [recordId, ...ein Wert je Feld, formatString]
  const v = (i: number) => (i < 0 ? null : (row[i + 1] as string | undefined) ?? null);

  const rawName = v(idx(labels, /^name|nachname|athlet|participant/i));
  if (!rawName) return null;
  const clean = String(rawName).replace(/\[img:[^\]]*\]/g, "").trim();
  const [last, first] = clean.includes(",")
    ? clean.split(",").map((s) => s.trim())
    : [clean.split(" ").slice(-1)[0], clean.split(" ").slice(0, -1).join(" ")];

  const li = lapsIndex(labels);
  if (li < 0) throw new Error(`Keine Rundenspalte in [${labels.join(", ")}]`);
  const lapsRaw = String(v(li) ?? "").trim();
  const laps = /^\d{1,3}$/.test(lapsRaw) ? Number(lapsRaw) : 0;

  const natRaw = v(idx(labels, /nat|land|country/i)) ?? "";
  const nat = /flags\/([A-Z]{2})\.svg/.exec(String(natRaw))?.[1] ?? null;

  const kmRaw = v(idx(labels, /kilometer|distanz|distance|km/i));
  const km = kmRaw ? Number(String(kmRaw).replace(/[^\d.]/g, "")) || null : null;

  return {
    rank: 0,
    name: clean,
    first: first || "",
    last: last || clean,
    nat,
    club: v(idx(labels, /verein|club|team/i)),
    laps,
    km,
    time: v(idx(labels, /zeit|time/i)),
    pace: v(idx(labels, /pace|schnitt|durch/i)),
  };
}

export async function fetchNation(
  n: { slug: string; nation: string; eventId: string; contest?: string },
  revalidate = 60,
): Promise<NationLive> {
  const cfg = await getConfig(n.eventId, Math.max(revalidate, 300));
  const listName = pickList(cfg);
  if (!listName) throw new Error(`Keine Ergebnisliste für ${n.nation}`);

  const contest = n.contest ?? Object.keys(cfg.contests ?? { "1": "" })[0] ?? "1";
  const qs = new URLSearchParams({
    key: cfg.key,
    listname: listName,
    page: "results",
    contest,
    r: "all",
  });
  const raw = await rr<RawList>(`/${n.eventId}/results/list?${qs}`, revalidate);

  const labels = (raw.list?.Fields ?? []).map((f) => f.Label);
  const groups = Array.isArray(raw.data) ? { all: raw.data } : (raw.data ?? {});
  const rows = Object.values(groups).flat() as unknown[][];

  const runners = rows
    .map((r) => toRunner(r, labels))
    .filter((r): r is Runner => r !== null)
    .sort((a, b) => b.laps - a.laps)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const laps = runners.reduce((s, r) => s + r.laps, 0);
  const currentLap = runners[0]?.laps ?? 0;

  return {
    slug: n.slug,
    nation: n.nation,
    eventId: n.eventId,
    eventName: cfg.eventname,
    listName,
    over: Boolean(cfg.EventOver),
    runners,
    laps,
    yards: laps,
    standing: runners.filter((r) => r.laps >= currentLap && currentLap > 0).length,
    currentLap,
    fetchedAt: new Date().toISOString(),
  };
}
