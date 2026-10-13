import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { studioAccess } from "@/app/backyard/_lib/studio-access";
import { LOG_KEYS, PIERRE, type LapManual } from "@/app/backyard/_lib/studio-log";

export const dynamic = "force-dynamic";

/**
 * Pierres Runden-Log: Handeinträge je Runde (Tabelle backyard_studio_log)
 * und die Rundenzeiten, die der Minuten-Cron aus race|result mitschreibt
 * (backyard_rr_laps). Zwei Läufe: «live» fürs Rennen, «test» fürs Testrennen.
 * Runde −1 hält die Einstellungen (eigene Marken, Meilensteine).
 * Nur mit Studio-Schlüssel der Stufe «all».
 */

const RUNS = new Set(["live", "test"]);

function guard(req: NextRequest) {
  return studioAccess(req.nextUrl.searchParams.get("k")) === "all";
}

export async function GET(req: NextRequest) {
  if (!guard(req)) return NextResponse.json({ error: "Kein Zugang." }, { status: 403 });
  const run = req.nextUrl.searchParams.get("run") ?? "live";
  if (!RUNS.has(run)) return NextResponse.json({ error: "Unbekannter Lauf." }, { status: 400 });

  const [log, rr] = await Promise.all([
    supabaseAdmin.from("backyard_studio_log").select("lap, manual, updated_at").eq("run", run),
    run === "live"
      ? supabaseAdmin.from("backyard_rr_laps").select("lap, lap_time, status").eq("year", 2026).eq("runner", PIERRE).order("lap")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (log.error || rr.error) return NextResponse.json({ error: (log.error ?? rr.error)!.message }, { status: 500 });
  return NextResponse.json({ manual: log.data, rr: rr.data }, { headers: { "Cache-Control": "no-store" } });
}

/** Ein Eintrag: { run, lap, manual } ersetzt die Handwerte dieser Runde */
export async function PUT(req: NextRequest) {
  if (!guard(req)) return NextResponse.json({ error: "Kein Zugang." }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { run?: string; lap?: number; manual?: Record<string, unknown> } | null;
  const run = body?.run ?? "";
  const lap = Number(body?.lap);
  if (!RUNS.has(run) || !Number.isInteger(lap) || lap < -1 || lap > 200) {
    return NextResponse.json({ error: "Ungültiger Eintrag." }, { status: 400 });
  }
  let manual: LapManual | Record<string, unknown> = {};
  if (lap === -1) {
    // Einstellungen: nur Listen aus Name + Zahl
    const m = body?.manual ?? {};
    const list = (v: unknown, num: string) =>
      Array.isArray(v)
        ? v.slice(0, 30).map((x) => ({ name: String((x as Record<string, unknown>)?.name ?? "").slice(0, 40), [num]: Number((x as Record<string, unknown>)?.[num]) || 0 }))
        : undefined;
    manual = { marks: list(m.marks, "laps"), miles: list(m.miles, "km") };
  } else {
    for (const k of LOG_KEYS) {
      const v = body?.manual?.[k];
      if (typeof v === "string") (manual as LapManual)[k] = v.slice(0, k === "notiz" ? 280 : 12);
    }
  }
  const { error } = await supabaseAdmin
    .from("backyard_studio_log")
    .upsert({ run, lap, manual, updated_at: new Date().toISOString() }, { onConflict: "run,lap" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Testlauf zurücksetzen */
export async function DELETE(req: NextRequest) {
  if (!guard(req)) return NextResponse.json({ error: "Kein Zugang." }, { status: 403 });
  if (req.nextUrl.searchParams.get("run") !== "test") return NextResponse.json({ error: "Nur der Testlauf." }, { status: 400 });
  const { error } = await supabaseAdmin.from("backyard_studio_log").delete().eq("run", "test").gt("lap", 0);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
