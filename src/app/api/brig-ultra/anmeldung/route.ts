import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EVENT } from "@/app/brig-ultra/event";

/* Anmeldung für 50 km Brig.
   Die Anmeldung wird in Supabase gespeichert (Tabelle brig_ultra_anmeldungen,
   RLS an und ohne Policy — nur der Service-Role-Key hier kommt heran) und
   zusätzlich als Mail gemeldet. Die Datenbank ist die Liste, die Mail ist die
   Benachrichtigung: fällt der Mailversand aus, ist die Anmeldung trotzdem da. */

const TABELLE = "brig_ultra_anmeldungen";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

/* Alles rund um dieses Event läuft bei Pierre über Natural Athletics.
   Zweitempfänger (z. B. das Studio) kommasepariert in die Env eintragen. */
const ZIEL = process.env.BRIG_ULTRA_ANMELDUNG_TO || EVENT.postfach;

function sauber(wert: unknown, max = 500) {
  return String(wert ?? "")
    .replace(/\p{Cc}/gu, " ")
    .trim()
    .slice(0, max);
}

const ENTITAETEN: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escape(text: string) {
  return text.replace(/[&<>"]/g, (z) => ENTITAETEN[z]);
}

export async function POST(request: NextRequest) {
  try {
    const koerper = await request.json();

    /* Honigfalle: ausgefüllt heisst Bot. Wir antworten trotzdem freundlich,
       damit der Bot nichts daraus lernt — aber wir schreiben es ins Log,
       damit ein Fehlalarm auffällt und nicht wieder eine echte Anmeldung
       unbemerkt verschluckt. `website` bleibt als alter Feldname stehen,
       solange noch zwischengespeicherte Seiten unterwegs sind. */
    if (sauber(koerper.bru_feld) || sauber(koerper.website)) {
      console.warn("[brig-ultra/anmeldung] Honigfalle ausgelöst", {
        email: sauber(koerper.email, 160),
      });
      return NextResponse.json({ ok: true });
    }

    /* Vor- und Nachname kommen getrennt; `name` bleibt die zusammengesetzte
       Fassung, weil Anrede und Betreff sie so brauchen. Ältere Aufrufe mit
       einem einzelnen `name`-Feld funktionieren weiter. */
    const vorname = sauber(koerper.vorname, 80);
    const nachname = sauber(koerper.nachname, 80);
    const name =
      [vorname, nachname].filter(Boolean).join(" ") ||
      sauber(koerper.name, 160);

    const email = sauber(koerper.email, 160).toLowerCase();
    const umfang = sauber(koerper.umfang, 60) || "Weiss ich noch nicht";
    const notiz = sauber(koerper.notiz, 1000);

    /* WhatsApp-Nummer: alles ausser Ziffern, Pluszeichen und Leerzeichen
       fliegt raus, damit aus «079 000 00 00 (mobil)» eine Nummer wird. */
    const telefon = sauber(koerper.telefon, 40)
      .replace(/[^\d+ ]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const shirt = sauber(koerper.shirt, 20);

    /* Ohne Häkchen keine Anmeldung: die Angaben gehen an zwei Stellen, also
       muss die Zustimmung nachweisbar sein. Der Zeitpunkt wird gespeichert. */
    const einwilligung = sauber(koerper.einwilligung, 10) === "ja";
    if (!einwilligung) {
      return NextResponse.json(
        {
          error:
            "Bitte bestätige noch, dass wir deine Angaben verwenden dürfen.",
        },
        { status: 400 },
      );
    }

    if (!telefon || telefon.replace(/\D/g, "").length < 9) {
      return NextResponse.json(
        { error: "Bitte trag deine WhatsApp-Nummer ein." },
        { status: 400 },
      );
    }

    if (!shirt) {
      return NextResponse.json(
        { error: "Bitte wähle eine T-Shirt-Grösse." },
        { status: 400 },
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Bitte trag deinen Namen ein." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse sieht nicht richtig aus." },
        { status: 400 },
      );
    }

    /* Die IP nur als Hash, damit sich Missbrauch nachvollziehen lässt, ohne
       dass wir Adressen von Teilnehmenden herumliegen haben. */
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const ipHash = ip
      ? createHash("sha256").update(`50kmbrig:${ip}`).digest("hex").slice(0, 32)
      : null;

    /* Wer sich zweimal anmeldet, korrigiert damit seine erste Anmeldung —
       die Unique-Constraint auf email macht daraus ein Update. */
    const { data: gespeichert, error: dbFehler } = await supabaseAdmin
      .from(TABELLE)
      .upsert(
        {
          name,
          vorname: vorname || null,
          nachname: nachname || null,
          email,
          telefon: telefon || null,
          shirt: shirt || null,
          umfang,
          notiz: notiz || null,
          quelle: EVENT.domain,
          ip_hash: ipHash,
          einwilligung_am: new Date().toISOString(),
          storniert_am: null,
        },
        { onConflict: "email" },
      )
      .select("id, erstellt_am")
      .single();

    if (dbFehler) {
      console.error("[brig-ultra/anmeldung] Supabase:", dbFehler);
      return NextResponse.json(
        { error: "Die Anmeldung kam nicht durch." },
        { status: 500 },
      );
    }

    /* Wie viele es inzwischen sind — steht in der Meldung an Pierre, damit er
       den Stand sieht, ohne die Tabelle zu öffnen. */
    const { count } = await supabaseAdmin
      .from(TABELLE)
      .select("id", { count: "exact", head: true })
      .is("storniert_am", null);

    const zeilen: [string, string][] = [
      ["Name", name],
      ["E-Mail", email],
      ["WhatsApp", telefon || "—"],
      ["T-Shirt", shirt || "—"],
      ["Umfang", umfang],
      ["Notiz", notiz || "—"],
      ["Angemeldet total", count != null ? String(count) : "—"],
    ];

    const absender = `"50 km Brig" <${process.env.SMTP_USER}>`;

    /* Die beiden Mails brauchen zusammen rund vier Sekunden. So lange darf
       niemand auf «Moment …» starren — gespeichert ist die Anmeldung ja
       schon. `after` lässt die Antwort sofort raus und schickt die Mails
       danach; scheitert der Versand, ist die Anmeldung trotzdem in der
       Liste. */
    after(async () => {
      try {
        await transporter.sendMail({
          from: absender,
          to: ZIEL,
          replyTo: `"${name.replace(/"/g, "")}" <${email}>`,
          subject: `50 km Brig — Anmeldung: ${name}`,
          text: zeilen.map(([k, v]) => `${k}: ${v}`).join("\n"),
          html: `<h2 style="font-family:sans-serif">Neue Anmeldung — 50 km Brig</h2>
<table style="font-family:sans-serif;font-size:15px;border-collapse:collapse">
${zeilen
  .map(
    ([k, v]) =>
      `<tr><td style="padding:6px 16px 6px 0;color:#666">${k}</td><td style="padding:6px 0"><b>${escape(
        v,
      )}</b></td></tr>`,
  )
  .join("\n")}
</table>`,
        });

        await transporter.sendMail({
          from: absender,
          to: email,
          replyTo: EVENT.postfach,
          subject: `Du bist dabei — 50 km Brig, ${EVENT.datumKurz}`,
          text: [
            `Hallo ${vorname || name}`,
            "",
            "Schön, bist du dabei.",
            "",
            EVENT.datum,
            `${EVENT.start} bis ${EVENT.ende} Uhr`,
            `${EVENT.treffpunkt}, ${EVENT.ort}`,
            "",
            "Wir laufen 50 Kilometer, aufgeteilt auf zehn Stunden. Alle 30",
            "Minuten startet eine Runde von 2,5 km, danach eine kurze Challenge",
            "im Studio. Du kannst eine Runde mitlaufen oder den ganzen Tag",
            "bleiben — beides zählt.",
            "",
            `Du hast «${umfang}» angegeben. Das ist kein Versprechen, du kannst`,
            "es jederzeit ändern.",
            "",
            "Mitbringen: Laufschuhe, Wechselshirt, Trinkflasche.",
            "Startgeld gibt es keines.",
            ...(shirt && shirt !== "Kein Shirt"
              ? [
                  "",
                  `Deine Shirtgrösse (${shirt}) haben wir notiert — das`,
                  "Stadtfitness Brig verschenkt T-Shirts am Anlass.",
                ]
              : []),
            "",
            "Eine Woche vorher melden wir uns nochmal mit den letzten Details.",
            `Wenn du doch nicht kannst, schreib einfach an ${EVENT.postfach}.`,
            "",
            "Liebe Grüsse",
            "Pierre",
            "",
            EVENT.domain,
          ].join("\n"),
        });
      } catch (mailFehler) {
        console.error("[brig-ultra/anmeldung] Mail:", mailFehler);
      }
    });

    return NextResponse.json({ ok: true, id: gespeichert?.id });
  } catch (fehler) {
    console.error("[brig-ultra/anmeldung]", fehler);
    return NextResponse.json(
      { error: "Die Anmeldung kam nicht durch." },
      { status: 500 },
    );
  }
}
