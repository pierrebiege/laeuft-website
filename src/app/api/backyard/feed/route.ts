import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Der Live-Feed der Backyard-Seite. Zwei Sorten Beiträge in einer Spalte:
 *
 *   cheer  Zurufe von aussen. Jeder darf, ohne Schlüssel — die Idee kam aus
 *          dem Team: Nachrichten, die der Crew im Zelt vorgelesen werden.
 *   crew   Meldungen von der Strecke. Wer den Schlüssel hat, schreibt sie;
 *          sie sind im Feed als solche gekennzeichnet.
 *
 * Der Client redet nie direkt mit Supabase. Nach dem Anon-Key-Leck vom Juni
 * gilt: jeder Tabellenzugriff läuft über eine Server-Route mit Service-Role.
 * Beide Tabellen haben RLS an und geben `anon` nichts.
 */

const MAX_BODY = 240;
const MAX_AUTHOR = 24;
/** Beiträge je Absender in fünf Minuten. Ohne Schlüssel zählt die Herkunft. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 5 * 60_000;

const clean = (s: unknown, max: number) =>
  String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Herkunft nur als Hash. Wir brauchen sie, um Dauerfeuer zu bremsen, und
 * haben keinen Grund, Adressen von Leuten aufzubewahren, die jemanden
 * anfeuern wollten.
 */
function originHash(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const salt = process.env.BACKYARD_FEED_ADMIN_KEY ?? "backyard";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function GET() {
  const db = supabaseAdmin;
  const [{ data: rows }, { data: settings }] = await Promise.all([
    db.from("backyard_feed").select("id, created_at, author, body, kind")
      .eq("hidden", false).order("created_at", { ascending: false }).limit(200),
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

  // ---- Moderation
  if (payload.adminKey) {
    if (payload.adminKey !== process.env.BACKYARD_FEED_ADMIN_KEY) {
      return NextResponse.json({ error: "Wrong key." }, { status: 403 });
    }
    if (payload.hide) await db.from("backyard_feed").update({ hidden: true }).eq("id", payload.hide);
    if (typeof payload.open === "boolean") {
      await db.from("backyard_feed_settings").update({ open: payload.open }).eq("id", 1);
    }
    return NextResponse.json({ ok: true });
  }

  // Honigtopf: ein Feld, das kein Mensch sieht und jedes einfache Skript ausfüllt.
  if (clean(payload.website, 80)) return NextResponse.json({ post: null });

  const { data: settings } = await db
    .from("backyard_feed_settings").select("open").eq("id", 1).single();
  if (settings && settings.open === false) {
    return NextResponse.json({ error: "The feed is closed for now." }, { status: 423 });
  }

  // Mit Schlüssel schreibt die Crew, ohne Schlüssel feuert jemand an.
  const isCrew = Boolean(payload.key) && payload.key === process.env.BACKYARD_FEED_KEY;
  if (payload.key && !isCrew) {
    return NextResponse.json({ error: "This link does not work any more." }, { status: 403 });
  }

  const author = clean(payload.author, MAX_AUTHOR);
  const body = clean(payload.body, MAX_BODY);
  if (!author || !body) {
    return NextResponse.json({ error: "Name and message, please." }, { status: 400 });
  }

  // Bremse. Die Funktion läuft zustandslos, also zählen wir in der Datenbank.
  // Ohne Schlüssel über die Herkunft — ein Name ist zu leicht gewechselt.
  const ip = originHash(req);
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const q = db.from("backyard_feed").select("id", { count: "exact", head: true }).gte("created_at", since);
  const { count } = await (isCrew ? q.eq("author", author) : q.eq("ip_hash", ip));
  if ((count ?? 0) >= (isCrew ? RATE_LIMIT * 2 : RATE_LIMIT)) {
    return NextResponse.json({ error: "Give the others a turn — try again in a few minutes." }, { status: 429 });
  }

  const { data, error } = await db
    .from("backyard_feed")
    .insert({ author, body, kind: isCrew ? "crew" : "cheer", ip_hash: ip })
    .select("id, created_at, author, body, kind")
    .single();
  if (error) return NextResponse.json({ error: "Could not save." }, { status: 500 });

  return NextResponse.json({ post: data });
}
