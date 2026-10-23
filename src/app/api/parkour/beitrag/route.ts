import { NextRequest, NextResponse, after } from "next/server";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BUCKET, TABELLE, melden, sauber, type Beitrag, type DateiEintrag } from "@/lib/parkourDoku";
import { dateiErlaubt, dateiTyp } from "@/app/parkour/dateitypen";

/* Neuer Beitrag zur Parkour-Doku (laeuft.ch/parkour).
   Ohne Dateien wird der Beitrag gespeichert und gemeldet.
   Mit Dateien wird er als «hochladen» angelegt; die Antwort enthält pro
   Datei eine signierte Upload-URL in den privaten Bucket. Der Browser lädt
   direkt dorthin (nicht durch diese Funktion) und meldet danach an
   /api/parkour/beitrag/fertig, was angekommen ist. */

export const runtime = "nodejs";

const MAX_MB = Number(process.env.PARKOUR_MAX_MB) || 50;
const MAX_DATEIEN = 30;
const PRO_STUNDE = 8; // Beiträge pro IP und Stunde

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INSTAGRAM = /^@?[A-Za-z0-9._]{2,30}$/;

function dateiname(name: string) {
  const basis = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(-80);
  return basis || "datei";
}

function fehler(text: string, status = 400) {
  return NextResponse.json({ ok: false, fehler: text }, { status });
}

export async function POST(request: NextRequest) {
  let k: Record<string, unknown>;
  try {
    k = await request.json();
  } catch {
    return fehler("Ungültige Anfrage.");
  }

  /* Honigfalle und Zeitfalle: ausgefüllt oder in unter 3 Sekunden
     abgeschickt heisst Bot. Freundlich antworten, nichts speichern. */
  const dauer = Number(k.dauer_ms) || 0;
  if (sauber(k.pk_strasse) || dauer < 3000) {
    console.warn("[parkour/beitrag] Falle ausgelöst", { dauer });
    return NextResponse.json({ ok: true, uploads: [] });
  }

  const art = sauber(k.art, 20);
  if (art !== "video" && art !== "material" && art !== "hinweis") return fehler("Unbekannte Art.");
  const sprache = sauber(k.sprache, 2) === "fr" ? "fr" : "de";

  const name = sauber(k.name, 120);
  const kontakt = sauber(k.kontakt, 160);
  if (name.length < 2) return fehler("Name fehlt.");
  if (!EMAIL.test(kontakt) && !INSTAGRAM.test(kontakt)) return fehler("Kontakt fehlt.");
  if (k.einverstaendnis !== true) return fehler("Einverständnis fehlt.");

  const link = sauber(k.link, 1000);
  if (link && !/^https?:\/\//i.test(link) && !/^[\w.-]+\.[a-z]{2,}\//i.test(link)) {
    return fehler(sprache === "fr" ? "Le lien ne semble pas correct." : "Der Link sieht nicht richtig aus.");
  }
  const offline = art === "material" && k.offline_material === true;
  const hinweis = art === "hinweis" ? sauber(k.hinweis, 6000) : "";

  const antwortenRoh = (art === "hinweis" && typeof k.antworten === "object" && k.antworten) || {};
  const antworten: Record<string, string> = {};
  for (const schluessel of ["wettkampf", "wer_gebracht", "zukunft"]) {
    const v = sauber((antwortenRoh as Record<string, unknown>)[schluessel], 2000);
    if (v) antworten[schluessel] = v;
  }

  /* Dateien prüfen: Anzahl, Typ, Grösse. */
  const roh = art === "hinweis" || !Array.isArray(k.dateien) ? [] : (k.dateien as unknown[]);
  if (roh.length > MAX_DATEIEN) return fehler(`Höchstens ${MAX_DATEIEN} Dateien pro Beitrag.`);
  const id = randomUUID();
  const dateien: DateiEintrag[] = [];
  for (let i = 0; i < roh.length; i++) {
    const d = (roh[i] ?? {}) as Record<string, unknown>;
    const original = sauber(d.name, 200) || `datei-${i + 1}`;
    const groesse = Number(d.groesse) || 0;
    const typ = sauber(d.typ, 100);
    if (!dateiErlaubt(original, typ)) return fehler("Nur Video, Foto oder PDF.");
    if (groesse <= 0 || groesse > MAX_MB * 1024 * 1024) return fehler(`Datei grösser als ${MAX_MB} MB.`);
    dateien.push({
      pfad: `${id}/${String(i + 1).padStart(2, "0")}-${dateiname(original)}`,
      name: original,
      groesse,
      typ: dateiTyp(original, typ),
      angekommen: false,
    });
  }

  if (art === "video" && !dateien.length && !link) return fehler("Video oder Link fehlt.");
  if (art === "material" && !dateien.length && !link && !offline) return fehler("Material fehlt.");
  if (art === "hinweis" && hinweis.length < 3) return fehler("Hinweis fehlt.");

  /* Ratenbegrenzung pro IP, gezählt in der Tabelle (überlebt Kaltstarts). */
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  const ipHash = ip ? createHash("sha256").update(`parkour-doku:${ip}`).digest("hex").slice(0, 32) : null;
  if (ipHash) {
    const { count } = await supabaseAdmin
      .from(TABELLE)
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("erstellt_am", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((count ?? 0) >= PRO_STUNDE) return fehler("Zu viele Versuche.", 429);
  }

  const schluessel = dateien.length ? randomBytes(24).toString("hex") : null;
  const zeile = {
    id,
    art,
    sprache,
    name,
    kontakt,
    gruppe_ort: sauber(k.gruppe_ort, 160) || null,
    jahre: sauber(k.jahre, 60) || null,
    wer_zu_sehen: art === "hinweis" ? null : sauber(k.wer_zu_sehen, 500) || null,
    beschreibung: art === "hinweis" ? null : sauber(k.beschreibung, 4000) || null,
    link: link || null,
    offline_material: offline,
    hinweis: hinweis || null,
    antworten,
    dateien,
    status: dateien.length ? "hochladen" : "eingegangen",
    einverstaendnis_am: new Date().toISOString(),
    schluessel_hash: schluessel ? createHash("sha256").update(schluessel).digest("hex") : null,
    ip_hash: ipHash,
  };

  const { error: dbFehler } = await supabaseAdmin.from(TABELLE).insert(zeile);
  if (dbFehler) {
    console.error("[parkour/beitrag] Supabase:", dbFehler);
    return fehler("Speichern fehlgeschlagen.", 500);
  }

  if (!dateien.length) {
    after(async () => {
      try {
        await melden(zeile as Beitrag);
      } catch (e) {
        console.error("[parkour/beitrag] Mail:", e);
      }
    });
    return NextResponse.json({ ok: true, id, uploads: [] });
  }

  /* Pro Datei eine signierte Upload-URL (gültig 2 Stunden). */
  const uploads: { pfad: string; url: string; typ: string }[] = [];
  for (const d of dateien) {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(d.pfad);
    if (error || !data) {
      console.error("[parkour/beitrag] Upload-URL:", error);
      await supabaseAdmin.from(TABELLE).update({ status: "unvollstaendig" }).eq("id", id);
      return fehler("Upload konnte nicht vorbereitet werden.", 500);
    }
    uploads.push({ pfad: d.pfad, url: data.signedUrl, typ: d.typ });
  }

  return NextResponse.json({ ok: true, id, schluessel, uploads });
}
