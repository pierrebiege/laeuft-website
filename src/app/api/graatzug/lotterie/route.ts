import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* Lotterie-Anmeldung für den Graatzug Backyard Ultra Simplon (19.06.2027).
   Die statische Seite liegt unter public/graatzug/. Gespeichert wird in
   Supabase (Tabelle graatzug_lotterie, RLS an und ohne Policy — nur der
   Service-Role-Key hier kommt heran). Die Datenbank ist die Liste, die Mail
   ist die Benachrichtigung: fällt der Mailversand aus, ist die Anmeldung da. */

const TABELLE = "graatzug_lotterie";
const KAUTION = 50;
const ZIEL = process.env.GRAATZUG_ANMELDUNG_TO || "biege.pierre@gmail.com";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ANZAHL = ["0", "1", "2–3", "4–6", "7+"];
const GESCHLECHT = ["weiblich", "männlich", "divers"];

function sauber(wert: unknown, max = 500) {
  return String(wert ?? "").replace(/\p{Cc}/gu, " ").trim().slice(0, max);
}
function zahl(wert: unknown, min: number, max: number) {
  const n = Number.parseInt(sauber(wert, 6), 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function escape(text: string) {
  return text.replace(/[&<>"]/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[z]!);
}
function fehler(text: string) {
  return NextResponse.json({ error: text }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const k = await request.json();

    /* Honigfalle unter einem Namen, den kein Passwortmanager ausfüllt.
       Auslösen wird geloggt, damit ein Fehlalarm auffällt. */
    if (sauber(k.gz_feld)) {
      console.warn("[graatzug/lotterie] Honigfalle ausgelöst", { email: sauber(k.email, 160) });
      return NextResponse.json({ ok: true });
    }

    const vorname = sauber(k.vorname, 80);
    const nachname = sauber(k.nachname, 80);
    const email = sauber(k.email, 160).toLowerCase();
    const telefon = sauber(k.telefon, 40).replace(/[^\d+ ]/g, "").replace(/\s+/g, " ").trim();
    const geburtsjahr = zahl(k.geburtsjahr, 1930, 2009);
    const geschlecht = sauber(k.geschlecht, 20);
    const wohnort = sauber(k.wohnort, 80);
    const land = sauber(k.land, 60);
    const anzahl = sauber(k.anzahl_backyards, 10);
    const bestleistung = zahl(k.bestleistung, 0, 200);
    const bestleistungWo = sauber(k.bestleistung_wo, 160);
    const zielrunden = zahl(k.zielrunden, 1, 200);
    const motivation = sauber(k.motivation, 1200);

    if (vorname.length < 2 || nachname.length < 2) return fehler("Bitte trag Vor- und Nachnamen ein.");
    if (!EMAIL_MUSTER.test(email)) return fehler("Diese E-Mail-Adresse sieht nicht richtig aus.");
    if (telefon.replace(/\D/g, "").length < 9) return fehler("Bitte trag deine Telefonnummer ein.");
    if (!geburtsjahr) return fehler("Bitte trag dein Geburtsjahr ein.");
    if (!GESCHLECHT.includes(geschlecht)) return fehler("Bitte wähle eine Kategorie.");
    if (wohnort.length < 2 || land.length < 2) return fehler("Bitte trag Wohnort und Land ein.");
    if (!ANZAHL.includes(anzahl)) return fehler("Wie viele Backyards bist du schon gelaufen?");
    if (bestleistung === null) return fehler("Wie viele Runden war dein längstes Backyard? Noch keins = 0.");
    if (!zielrunden) return fehler("Wie viele Runden möchtest du am Graatzug laufen?");
    if (sauber(k.volljaehrig, 5) !== "ja") return fehler("Am Renntag musst du mindestens 18 Jahre alt sein.");
    if (sauber(k.kaution, 5) !== "ja") return fehler("Bitte bestätige, dass du die Kaution gelesen hast.");
    if (sauber(k.einwilligung, 5) !== "ja") return fehler("Bitte bestätige, dass wir deine Angaben verwenden dürfen.");

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const ipHash = ip ? createHash("sha256").update(`graatzug:${ip}`).digest("hex").slice(0, 32) : null;
    const jetzt = new Date().toISOString();

    /* Zweite Anmeldung mit derselben Adresse = Korrektur der ersten. */
    const { error: dbFehler } = await supabaseAdmin.from(TABELLE).upsert(
      {
        vorname, nachname, email, telefon, geburtsjahr, geschlecht, wohnort, land,
        anzahl_backyards: anzahl, bestleistung, bestleistung_wo: bestleistungWo || null,
        zielrunden, motivation: motivation || null, volljaehrig: true,
        einwilligung_am: jetzt, kaution_ok_am: jetzt, aktualisiert_am: jetzt,
        ip_hash: ipHash, quelle: "laeuft.ch/graatzug",
      },
      { onConflict: "email" },
    );
    if (dbFehler) {
      console.error("[graatzug/lotterie] Supabase:", dbFehler);
      return NextResponse.json({ error: "Die Anmeldung kam nicht durch. Versuch es bitte nochmal." }, { status: 500 });
    }

    const { count } = await supabaseAdmin.from(TABELLE).select("id", { count: "exact", head: true }).eq("status", "angemeldet");
    const name = `${vorname} ${nachname}`;
    const zeilen: [string, string][] = [
      ["Name", name], ["E-Mail", email], ["Telefon", telefon], ["Jahrgang", String(geburtsjahr)],
      ["Kategorie", geschlecht], ["Wohnort", `${wohnort}, ${land}`], ["Backyards bisher", anzahl],
      ["Längstes Backyard", `${bestleistung} Runden${bestleistungWo ? ` (${bestleistungWo})` : ""}`],
      ["Ziel am Graatzug", `${zielrunden} Runden`], ["Motivation", motivation || "—"],
      ["Im Lostopf total", count != null ? String(count) : "—"],
    ];
    const absender = `"Graatzug Backyard Ultra" <${process.env.SMTP_USER}>`;

    after(async () => {
      try {
        await transporter.sendMail({
          from: absender, to: ZIEL, replyTo: `"${name.replace(/"/g, "")}" <${email}>`,
          subject: `Graatzug Lotterie: ${name} (${bestleistung} Runden)`,
          text: zeilen.map(([a, b]) => `${a}: ${b}`).join("\n"),
          html: `<h2 style="font-family:sans-serif">Neu im Lostopf — Graatzug</h2><table style="font-family:sans-serif;font-size:15px;border-collapse:collapse">${zeilen
            .map(([a, b]) => `<tr><td style="padding:6px 16px 6px 0;color:#666">${a}</td><td style="padding:6px 0"><b>${escape(b)}</b></td></tr>`)
            .join("")}</table>`,
        });
        await transporter.sendMail({
          from: absender, to: email, replyTo: "pierre@natural-athletics.ch",
          subject: "Du bist im Lostopf — Graatzug Backyard Ultra Simplon",
          text: [
            `Hey ${vorname}`,
            "",
            "Du bist im Lostopf für den Graatzug Backyard Ultra am Simplonpass.",
            "",
            "Samstag, 19. Juni 2027, erste Runde um 12:00",
            "Barralhaus, Simplonpass",
            "",
            "So geht es weiter:",
            "1. Nach Anmeldeschluss losen wir rund 130 Startplätze aus. Datum folgt.",
            "2. Wer gezogen wird, bekommt eine Mail mit Startgeld und Kaution.",
            `3. Die Kaution beträgt CHF ${KAUTION}. Du bekommst sie zurück, wenn du nach dem Rennen das Camp verlässt und dein Quadrat leer und sauber ist.`,
            "4. Deine Crew meldest du erst nach der Auslosung an.",
            "",
            `Deine Angaben: ${anzahl} Backyards bisher, längstes ${bestleistung} Runden, Ziel ${zielrunden} Runden.`,
            "Wenn du etwas ändern willst, meld dich einfach nochmal mit derselben E-Mail-Adresse an.",
            "",
            "Liebe Grüsse",
            "Pierre, Daniel und Anes",
            "",
            "laeuft.ch/graatzug",
          ].join("\n"),
        });
      } catch (e) {
        console.error("[graatzug/lotterie] Mail:", e);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[graatzug/lotterie]", e);
    return NextResponse.json({ error: "Unerwarteter Fehler." }, { status: 500 });
  }
}
