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

/* Telefonnummer: alles ausser Ziffern, Pluszeichen und Leerzeichen fliegt
   raus, damit aus «079 000 00 00 (mobil)» eine Nummer wird. */
function nummer(text: string) {
  return text
    .replace(/[^\d+ ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

    /* WhatsApp-Nummer, bereinigt wie jede Nummer hier. */
    const telefon = nummer(sauber(koerper.telefon, 40));

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

    /* Alter: wer am Anlasstag unter 18 ist, meldet sich nur mit einem
       Elternteil an — Name, Telefon für den Notfall, E-Mail für die Kopie
       und das Häkchen. Ohne Antwort auf die Frage keine Anmeldung. */
    const volljaehrigWahl = sauber(koerper.volljaehrig, 10);
    if (volljaehrigWahl !== "ja" && volljaehrigWahl !== "nein") {
      return NextResponse.json(
        { error: "Bitte sag uns noch, ob du 18 oder älter bist." },
        { status: 400 },
      );
    }
    const volljaehrig = volljaehrigWahl === "ja";

    let alterJahre: number | null = null;
    let elternName = "";
    let elternTelefon = "";
    let elternEmail = "";
    if (!volljaehrig) {
      alterJahre = Number.parseInt(sauber(koerper.alter_jahre, 3), 10);
      elternName = sauber(koerper.eltern_name, 160);
      elternTelefon = nummer(sauber(koerper.eltern_telefon, 40));
      elternEmail = sauber(koerper.eltern_email, 160).toLowerCase();

      if (!Number.isFinite(alterJahre) || alterJahre < 1 || alterJahre > 17) {
        return NextResponse.json(
          { error: "Bitte trag dein Alter ein." },
          { status: 400 },
        );
      }
      if (elternName.length < 3) {
        return NextResponse.json(
          { error: "Bitte trag den Namen deiner Mutter oder deines Vaters ein." },
          { status: 400 },
        );
      }
      if (elternTelefon.replace(/\D/g, "").length < 9) {
        return NextResponse.json(
          { error: "Bitte trag die Telefonnummer deiner Eltern ein." },
          { status: 400 },
        );
      }
      if (!EMAIL_MUSTER.test(elternEmail)) {
        return NextResponse.json(
          { error: "Die E-Mail-Adresse deiner Eltern sieht nicht richtig aus." },
          { status: 400 },
        );
      }
      if (sauber(koerper.eltern_einwilligung, 10) !== "ja") {
        return NextResponse.json(
          {
            error:
              "Unter 18 geht es nur mit dem Häkchen deiner Eltern — bitte frag sie kurz.",
          },
          { status: 400 },
        );
      }
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
    if (!EMAIL_MUSTER.test(email)) {
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
          /* Bei einer Korrektur als Volljährige:r werden die Elternfelder
             bewusst geleert — sonst bliebe ein alter Elternteil stehen. */
          volljaehrig,
          alter_jahre: alterJahre,
          eltern_name: elternName || null,
          eltern_telefon: elternTelefon || null,
          eltern_email: elternEmail || null,
          eltern_einwilligung_am: volljaehrig ? null : new Date().toISOString(),
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
      ["Alter", volljaehrig ? "18 oder älter" : `${alterJahre} — MINDERJÄHRIG`],
      ...(volljaehrig
        ? []
        : ([
            ["Elternteil", elternName],
            ["Telefon Eltern", elternTelefon],
            ["E-Mail Eltern", elternEmail],
            ["Einverständnis", "Häkchen gesetzt, Kopie an Eltern verschickt"],
          ] as [string, string][])),
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
          subject: `50 km Brig — Anmeldung: ${name}${
            volljaehrig ? "" : ` (U18, ${alterJahre} J.)`
          }`,
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

        /* Die Kopie an die Eltern ist der eigentliche Schutz: das Häkchen
           kann auch das Kind setzen, die Mail landet aber bei den Eltern.
           Stimmt etwas nicht, antworten sie — Reply-To ist das Postfach. */
        if (!volljaehrig) {
          await transporter.sendMail({
            from: absender,
            to: elternEmail,
            replyTo: EVENT.postfach,
            subject: `${vorname || name} hat sich für 50 km Brig angemeldet`,
            text: [
              `Hallo ${elternName}`,
              "",
              `${name} (${alterJahre}) hat sich für ${EVENT.nameLaut} angemeldet und`,
              "dabei angegeben, dass du einverstanden bist. Du bist als",
              `Notfallkontakt für den Tag eingetragen: ${elternTelefon}.`,
              "",
              EVENT.datum,
              `${EVENT.start} bis ${EVENT.ende} Uhr`,
              `${EVENT.treffpunkt}, ${EVENT.ort}`,
              "",
              "Kurz, worum es geht: ein gemeinsames Training, kein Rennen, ohne",
              "Zeitmessung. Alle 30 Minuten startet eine Runde von 2,5 km durch",
              "Brig auf öffentlichen Wegen, danach eine kurze Übung im Studio.",
              "Jede:r läuft so viele Runden, wie es sich gut anfühlt, und kann",
              "jederzeit aufhören. Die Strecke ist nicht abgesperrt, der Verkehr",
              "läuft normal. Die Teilnahme ist auf eigene Verantwortung, eine",
              "Unfallversicherung ist Sache der Teilnehmenden.",
              "",
              "Bitte sorg dafür, dass du am Tag unter der Nummer oben erreichbar",
              "bist.",
              "",
              "Wenn du NICHT einverstanden bist oder davon nichts wusstest,",
              "antworte einfach auf diese Mail — dann streichen wir die",
              "Anmeldung.",
              "",
              "Liebe Grüsse",
              "Pierre",
              "",
              EVENT.domain,
            ].join("\n"),
          });
        }
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
