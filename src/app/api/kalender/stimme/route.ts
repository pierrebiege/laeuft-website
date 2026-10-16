import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* Kalender 2027: Bildabstimmung unter laeuft.ch/kalender.
   Gespeichert in kalender_abstimmung (RLS an, ohne Policy — nur der
   Service-Role-Key hier kommt an die Adressen). Eine Stimme pro Adresse. */

const TABELLE = "kalender_abstimmung";
const ANZAHL = 12;
const ENDE = Date.parse("2026-10-21T20:00:00+02:00");
const LAENDER = ["CH", "DE", "AT", "anderes"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sauber(wert: unknown, max = 200) {
  return String(wert ?? "")
    .replace(/\p{Cc}/gu, " ")
    .trim()
    .slice(0, max);
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

export async function POST(request: NextRequest) {
  let koerper: Record<string, unknown>;
  try {
    koerper = await request.json();
  } catch {
    return NextResponse.json({ ok: false, fehler: "Leere Eingabe." }, { status: 400 });
  }

  // Honigfalle: ausgefüllt heisst Bot
  if (sauber(koerper.webseite)) return NextResponse.json({ ok: true });

  const bilder = Array.isArray(koerper.bilder)
    ? [...new Set(koerper.bilder.filter((b): b is string => typeof b === "string" && /^[a-z0-9-]{1,24}$/.test(b)))]
    : [];
  const oeffentlich = koerper.oeffentlich === true;

  // Öffentliche Abstimmung (Instagram): bis Fr 16.10.2026, 20 Uhr
  if (oeffentlich && Date.now() > ENDE)
    return NextResponse.json({ ok: false, fehler: "Die Abstimmung ist vorbei. Danke fürs Vorbeischauen." }, { status: 410 });
  if (bilder.length !== ANZAHL)
    return NextResponse.json({ ok: false, fehler: `Bitte wähle genau ${ANZAHL} Bilder.` }, { status: 400 });

  let zeile: Record<string, unknown>;
  let schluessel: string;
  if (oeffentlich) {
    const email = sauber(koerper.email, 160).toLowerCase();
    const land = sauber(koerper.land, 10);
    if (!EMAIL.test(email))
      return NextResponse.json({ ok: false, fehler: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 });
    if (!LAENDER.includes(land))
      return NextResponse.json({ ok: false, fehler: "Bitte wähle dein Land." }, { status: 400 });
    zeile = { quelle: "instagram", email, land, vorname: sauber(koerper.vorname, 80) || null, name: sauber(koerper.vorname, 80) || email, bilder };
    schluessel = "mail:" + email;
  } else {
    zeile = {
      quelle: "freunde",
      name: sauber(koerper.name, 120),
      email: sauber(koerper.email, 160) || null,
      strasse: sauber(koerper.strasse),
      plz: sauber(koerper.plz, 12),
      ort: sauber(koerper.ort, 120),
      land: sauber(koerper.land, 60) || "Schweiz",
      daten: ["mit", "ohne"].includes(sauber(koerper.daten, 8)) ? sauber(koerper.daten, 8) : null,
      bilder,
    };
    if (!zeile.name || !zeile.strasse || !zeile.plz || !zeile.ort)
      return NextResponse.json({ ok: false, fehler: "Bitte Name und vollständige Adresse ausfüllen." }, { status: 400 });
    schluessel = norm(String(zeile.strasse)) + "|" + norm(String(zeile.plz));
  }

  const adresse_key = createHash("sha256").update(schluessel).digest("hex").slice(0, 24);

  const { error } = await supabaseAdmin.from(TABELLE).insert({ ...zeile, adresse_key });
  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ ok: false, fehler: oeffentlich ? "Mit dieser E-Mail-Adresse wurde schon abgestimmt." : "Für diese Adresse ist schon eine Stimme eingetragen." }, { status: 409 });
    console.error("[kalender/stimme]", error);
    return NextResponse.json({ ok: false, fehler: "Speichern hat nicht geklappt. Versuch es bitte nochmals." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
