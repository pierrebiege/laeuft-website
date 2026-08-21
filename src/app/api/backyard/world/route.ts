import { NextRequest, NextResponse } from "next/server";
import { fetchNation, type NationLive } from "@/app/backyard/_lib/raceresult";
import { sourcesFor } from "@/app/backyard/_data/nations";

export const revalidate = 60;

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year") === "2024" ? "2024" : "2026";
  const sources = sourcesFor(year);

  const settled = await Promise.allSettled(sources.map((s) => fetchNation(s, 60)));
  const nations = settled
    .filter((r): r is PromiseFulfilledResult<NationLive> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => b.laps - a.laps);

  const failed = settled
    .map((r, i) => (r.status === "rejected" ? sources[i].nation : null))
    .filter(Boolean);

  return NextResponse.json(
    { year, nations, failed, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } },
  );
}
