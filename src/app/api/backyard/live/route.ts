import { NextRequest, NextResponse } from "next/server";
import { fetchNation } from "@/app/backyard/_lib/raceresult";
import { sourcesFor } from "@/app/backyard/_data/nations";

export const revalidate = 30;

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year") === "2024" ? "2024" : "2026";
  const slug = req.nextUrl.searchParams.get("nation") ?? "ch";
  const src = sourcesFor(year).find((n) => n.slug === slug);

  if (!src) {
    return NextResponse.json(
      { error: `No timing feed on file for ${slug} in ${year}.`, pending: true },
      { status: 404 },
    );
  }

  try {
    const data = await fetchNation(src, 30);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" },
    });
  } catch (e) {
    const msg = (e as Error).message;
    // Event-ID steht, aber der Zeitnehmer hat die Liste noch nicht freigegeben
    if (/keine öffentliche Liste/.test(msg)) {
      return NextResponse.json({ error: `No timing feed on file for ${slug} in ${year} yet.`, pending: true }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
