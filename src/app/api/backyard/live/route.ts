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
      { error: `Für ${slug} ist ${year} noch keine Zeitmessung hinterlegt.`, pending: true },
      { status: 404 },
    );
  }

  try {
    const data = await fetchNation(src, 30);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
