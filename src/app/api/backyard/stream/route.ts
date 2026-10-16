import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { youtubeEmbed } from "@/app/backyard/_lib/stream";

/**
 * Der Livestream-Link. Die Seite gibt als offiziellen Link sich selbst an;
 * welcher YouTube-Stream dahinter läuft, ändert die Regie über /regie, ohne
 * Deploy. Bricht der Stream ab und YouTube vergibt eine neue Adresse, steht
 * die neue innert einer halben Minute bei allen auf der Seite.
 *
 * Gespeichert in backyard_feed_settings (Zeile 1), Spalten stream_url und
 * stream_updated_at. Schreiben darf, wer BACKYARD_STREAM_KEY oder den
 * Moderationsschlüssel des Feeds hat.
 */
export async function GET() {
  const { data } = await supabaseAdmin
    .from("backyard_feed_settings").select("stream_url, stream_updated_at").eq("id", 1).single();
  const url = data?.stream_url ?? null;
  return NextResponse.json(
    { url, embed: youtubeEmbed(url), updatedAt: data?.stream_updated_at ?? null },
    { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30" } },
  );
}

const allowed = (key: unknown) =>
  typeof key === "string" && key.length > 0 &&
  (key === process.env.BACKYARD_STREAM_KEY || key === process.env.BACKYARD_FEED_ADMIN_KEY);

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload || !allowed(payload.key)) {
    return NextResponse.json({ error: "Falscher Schlüssel." }, { status: 403 });
  }
  // Nur prüfen: leer = Stream ausblenden.
  if (payload.check) return NextResponse.json({ ok: true });

  const url = String(payload.url ?? "").trim().slice(0, 300) || null;
  if (url && !youtubeEmbed(url)) {
    return NextResponse.json({ error: "Das ist kein YouTube-Link, den ich lesen kann." }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("backyard_feed_settings")
    .update({ stream_url: url, stream_updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return NextResponse.json({ error: "Konnte nicht speichern." }, { status: 500 });
  return NextResponse.json({ ok: true, url, embed: youtubeEmbed(url) });
}
