import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchNation } from "@/app/backyard/_lib/raceresult";
import { sourcesFor } from "@/app/backyard/_data/nations";
import { normName, toMmss } from "@/app/backyard/_lib/studio-log";

export const dynamic = "force-dynamic";

/**
 * Minuten-Cron fürs Rennwochenende: race|result zeigt nur den Stand jetzt
 * (Runden + Zeit der letzten Runde). Wer den Verlauf will, muss ihn selbst
 * wegschreiben. Wir merken uns je Läufer und Runde die Zeit, sobald sie
 * auftaucht. Ausserhalb des Rennfensters macht der Cron nichts (?force=1
 * zum Testen).
 */

const WINDOW = { from: Date.parse("2026-10-17T11:30:00Z"), to: Date.parse("2026-10-21T00:00:00Z") };

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const now = Date.now();
  if (req.nextUrl.searchParams.get("force") !== "1" && (now < WINDOW.from || now > WINDOW.to)) {
    return NextResponse.json({ skipped: "ausserhalb des Rennfensters" });
  }
  const src = sourcesFor("2026").find((n) => n.slug === "ch");
  if (!src) return NextResponse.json({ skipped: "RR_CH_2026 fehlt" });

  try {
    const live = await fetchNation(src, 0);
    const rows = live.runners
      .filter((r) => r.laps > 0)
      .map((r) => ({
        year: 2026,
        runner: normName(r.last),
        lap: r.laps,
        lap_time: toMmss(r.lastLap),
        status: r.status,
        seen_at: new Date().toISOString(),
      }));
    // Bestehende Zeiten nie mit «leer» überschreiben
    const { data: known } = await supabaseAdmin.from("backyard_rr_laps").select("runner, lap, lap_time").eq("year", 2026);
    const has = new Set((known ?? []).filter((k) => k.lap_time).map((k) => `${k.runner}:${k.lap}`));
    const upd = rows.filter((r) => r.lap_time || !has.has(`${r.runner}:${r.lap}`));
    if (upd.length) {
      const { error } = await supabaseAdmin.from("backyard_rr_laps").upsert(upd, { onConflict: "year,runner,lap" });
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ lap: live.currentLap, written: upd.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
