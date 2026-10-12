import { NextRequest, NextResponse } from "next/server";
import { studioAccess } from "@/app/backyard/_lib/studio-access";

/**
 * Pierres Runden aus Strava fürs Studio. Jede Runde ist eine eigene
 * Aktivität (Pierre beendet die Aufzeichnung nach jeder Runde).
 *
 * Env: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN
 * (einmalig mit scripts/strava-auth.mjs geholt, Scope activity:read_all).
 * Nur mit Studio-Schlüssel der Stufe «all» abrufbar.
 */

const RACE_START = "2026-10-17T12:00:00Z";

let cached: { token: string; until: number } | null = null;

async function accessToken() {
  if (cached && cached.until > Date.now() + 60_000) return cached.token;
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env;
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) throw new Error("Strava ist noch nicht verbunden.");
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: STRAVA_REFRESH_TOKEN,
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Strava-Anmeldung fehlgeschlagen (${r.status}).`);
  const j = (await r.json()) as { access_token: string; expires_at: number };
  cached = { token: j.access_token, until: j.expires_at * 1000 };
  return j.access_token;
}

async function strava<T>(path: string, token: string): Promise<T> {
  const r = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Strava ${r.status} für ${path.split("?")[0]}`);
  return (await r.json()) as T;
}

type Summary = {
  id: number;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_heartrate?: number;
  max_heartrate?: number;
  sport_type: string;
};

export async function GET(req: NextRequest) {
  if (studioAccess(req.nextUrl.searchParams.get("k")) !== "all") {
    return NextResponse.json({ error: "Kein Zugang." }, { status: 403 });
  }
  // ?since=2026-10-12 zum Testen mit einem Trainingslauf
  const sinceParam = req.nextUrl.searchParams.get("since");
  const since = new Date(sinceParam ? `${sinceParam}T00:00:00Z` : RACE_START);

  try {
    const token = await accessToken();
    const list = await strava<Summary[]>(`/athlete/activities?after=${Math.floor(since.getTime() / 1000)}&per_page=100`, token);
    const runs = list
      .filter((a) => /Run/.test(a.sport_type))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const laps = runs.map((a, i) => ({
      lap: i + 1,
      id: a.id,
      start: a.start_date,
      distance: a.distance,
      elapsed: a.elapsed_time,
      moving: a.moving_time,
      avgHr: a.average_heartrate ? Math.round(a.average_heartrate) : null,
      maxHr: a.max_heartrate ? Math.round(a.max_heartrate) : null,
    }));

    let last = null;
    const l = runs.at(-1);
    if (l) {
      const [detail, streams] = await Promise.all([
        strava<{ calories?: number }>(`/activities/${l.id}`, token),
        strava<Record<string, { data: unknown[] }>>(`/activities/${l.id}/streams?keys=latlng,heartrate,time&key_by_type=true`, token),
      ]);
      const step = (n: number) => Math.max(1, Math.ceil(n / 500));
      const ll = (streams.latlng?.data ?? []) as [number, number][];
      const hr = (streams.heartrate?.data ?? []) as number[];
      last = {
        kcal: detail.calories ? Math.round(detail.calories) : null,
        latlng: ll.filter((_, i) => i % step(ll.length) === 0),
        hr: hr.filter((_, i) => i % step(hr.length) === 0),
      };
    }
    return NextResponse.json({ laps, last, fetchedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
