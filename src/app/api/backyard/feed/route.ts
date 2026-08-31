import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Der Live-Feed der Backyard-Seite: Crew, Team und alle, die den Link
 * bekommen haben, schreiben hier hinein.
 *
 * Der Client redet nie direkt mit Supabase. Nach dem Anon-Key-Leck vom Juni
 * gilt: jeder Zugriff auf eine Tabelle läuft über eine Server-Route mit
 * Service-Role. Die Tabellen selbst haben RLS an und geben `anon` nichts.
 *
 *   GET                     sichtbare Beiträge, neueste zuerst
 *   POST { key, author, body }   schreiben, mit dem geteilten Schlüssel
 *   POST { adminKey, hide }      Beitrag verstecken oder Feed schliessen
 */

const MAX_BODY = 240;
const MAX_AUTHOR = 24;
/** Wie viele Beiträge ein Name in fünf Minuten schreiben darf. */
const RATE_LIMIT = 8;

const clean = (s: unknown, max: number) =>
  String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function GET() {
  const db = supabaseAdmin;
  const [{ data: rows }, { data: settings }] = await Promise.all([
    db.from("backyard_feed").select("id, created_at, author, body, kind")
      .eq("hidden", false).order("created_at", { ascending: false }).limit(120),
    db.from("backyard_feed_settings").select("open").eq("id", 1).single(),
  ]);
  return NextResponse.json(
    { open: settings?.open ?? true, posts: rows ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60" } },
  );
}

export async function POST(req: NextRequest) {
  const db = supabaseAdmin;
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "Malformed request." }, { status: 400 });

  // ---- Moderation: verstecken oder den ganzen Feed schliessen
  if (payload.adminKey) {
    if (payload.adminKey !== process.env.BACKYARD_FEED_ADMIN_KEY) {
      return NextResponse.json({ error: "Wrong key." }, { status: 403 });
    }
    if (payload.hide) {
      await db.from("backyard_feed").update({ hidden: true }).eq("id", payload.hide);
    }
    if (typeof payload.open === "boolean") {
      await db.from("backyard_feed_settings").update({ open: payload.open }).eq("id", 1);
    }
    return NextResponse.json({ ok: true });
  }

  // ---- Schreiben
  if (payload.key !== process.env.BACKYARD_FEED_KEY) {
    return NextResponse.json({ error: "This link does not work." }, { status: 403 });
  }

  const { data: settings } = await db
    .from("backyard_feed_settings").select("open").eq("id", 1).single();
  if (settings && settings.open === false) {
    return NextResponse.json({ error: "The feed is closed." }, { status: 423 });
  }

  const author = clean(payload.author, MAX_AUTHOR);
  const body = clean(payload.body, MAX_BODY);
  if (!author || !body) {
    return NextResponse.json({ error: "Name and message, please." }, { status: 400 });
  }

  // Bremse gegen Dauerfeuer. Die Funktion läuft zustandslos, also zählen
  // wir in der Datenbank statt im Speicher.
  const since = new Date(Date.now() - 5 * 60_000).toISOString();
  const { count } = await db
    .from("backyard_feed")
    .select("id", { count: "exact", head: true })
    .eq("author", author)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json({ error: "Slow down a moment." }, { status: 429 });
  }

  const { data, error } = await db
    .from("backyard_feed")
    .insert({ author, body, kind: "human" })
    .select("id, created_at, author, body, kind")
    .single();
  if (error) return NextResponse.json({ error: "Could not save." }, { status: 500 });

  return NextResponse.json({ post: data });
}
