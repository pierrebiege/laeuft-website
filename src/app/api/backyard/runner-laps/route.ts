import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { studioAccess } from "@/app/backyard/_lib/studio-access";
import { normName, trimRr, type RrLap } from "@/app/backyard/_lib/studio-log";
import { PHOTO_BASE, TEAM } from "@/app/backyard/_data/event";
import { PEOPLE_PHOTOS, PROFILES } from "@/app/backyard/_data/people";

export const dynamic = "force-dynamic";

/**
 * Rundenzeiten aller Läuferinnen und Läufer aus race|result, so wie der
 * Minuten-Cron sie mitgeschrieben hat (backyard_rr_laps). Fürs Studio, damit
 * auch die Organisation Grafiken zu jeder Person bauen kann.
 * Studio-Schlüssel «team» oder «all». Pierres Handlog und Strava bleiben
 * bei /studio-log bzw. /strava und nur mit «all».
 *
 * ?runner=<slug> liefert nur diese Person (slug = `photo` aus TEAM).
 */

export type RunnerLaps = {
  slug: string;
  first: string;
  last: string;
  pb: number;
  /** Kaderposition */
  pos: number | null;
  /** fertige Runden */
  laps: number;
  status: "in" | "out" | "winner";
  /** Platz im Schweizer Team, gleich viele Runden = gleicher Platz */
  rank: number;
  /** Standardbild fürs Studio */
  photo: string;
  rr: RrLap[];
};

const YEAR = 2026;

/** erstes Profilbild im Hochformat, sonst das Kaderporträt */
function photoOf(slug: string) {
  const ps = PROFILES[slug]?.photos ?? [];
  const i = ps.findIndex(([w, h]) => h > w);
  return i >= 0 ? `${PEOPLE_PHOTOS}/${slug}/${i + 1}.jpg` : `${PHOTO_BASE}/${slug}.jpg`;
}

export async function GET(req: NextRequest) {
  if (!studioAccess(req.nextUrl.searchParams.get("k"))) return NextResponse.json({ error: "Kein Zugang." }, { status: 403 });
  const only = req.nextUrl.searchParams.get("runner");

  const { data, error } = await supabaseAdmin
    .from("backyard_rr_laps")
    .select("runner, lap, lap_time, status")
    .eq("year", YEAR)
    .order("lap")
    .range(0, 2999);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const by = new Map<string, RrLap[]>();
  for (const r of data ?? []) {
    const list = by.get(r.runner) ?? [];
    list.push({ lap: r.lap, lap_time: r.lap_time, status: r.status });
    by.set(r.runner, list);
  }

  const base = TEAM.filter((a) => a.photo).map((a) => {
    const rr = trimRr(by.get(normName(a.name)) ?? []);
    const laps = rr.length ? rr[rr.length - 1].lap : 0;
    const out = rr.some((r) => r.status === "out");
    return { slug: a.photo!, first: a.first, last: a.name, pb: a.pb, pos: a.pos, laps, out, rr };
  });
  const stillIn = base.filter((r) => !r.out && r.laps > 0);
  const runners: RunnerLaps[] = base
    .map(({ out, ...r }) => ({
      ...r,
      status: (out ? "out" : stillIn.length === 1 && stillIn[0].slug === r.slug && base.every((x) => x.out || x.slug === r.slug) ? "winner" : "in") as RunnerLaps["status"],
      rank: 1 + base.filter((x) => x.laps > r.laps).length,
      photo: photoOf(r.slug),
    }))
    .sort((a, b) => b.laps - a.laps || (a.pos ?? 99) - (b.pos ?? 99));

  const body = only ? { runners: runners.filter((r) => r.slug === only) } : { runners };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
