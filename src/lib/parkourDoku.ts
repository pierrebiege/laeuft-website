import "server-only";
import nodemailer from "nodemailer";

/* Gemeinsames für die Beitrags-Routen der Doku «Wem gehört Parkour?». */

export const TABELLE = "parkour_beitraege";
export const BUCKET = "parkour-doku";

/* Wohin die Meldung über einen neuen Beitrag geht. Zweitempfänger (Ramon)
   kommasepariert in PARKOUR_MELDUNG_TO eintragen. */
const ZIEL = process.env.PARKOUR_MELDUNG_TO || "pierre@laeuft.ch";

export type DateiEintrag = {
  pfad: string;
  name: string;
  groesse: number;
  typ: string;
  angekommen: boolean;
};

export type Beitrag = {
  id: string;
  art: "video" | "material" | "hinweis";
  sprache: string;
  name: string;
  kontakt: string;
  gruppe_ort: string | null;
  jahre: string | null;
  wer_zu_sehen: string | null;
  beschreibung: string | null;
  link: string | null;
  offline_material: boolean;
  hinweis: string | null;
  antworten: Record<string, string>;
  dateien: DateiEintrag[];
  status: string;
};

export function sauber(wert: unknown, max = 500) {
  return String(wert ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max);
}

const ENTITAETEN: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
function escape(text: string) {
  return text.replace(/[&<>"]/g, (z) => ENTITAETEN[z]);
}

function mb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const ARTEN: Record<string, string> = {
  video: "Video-Statement",
  material: "Altes Material",
  hinweis: "Hinweis",
};

const FRAGEN: Record<string, string> = {
  wettkampf: "Gehört Wettkampf zu Parkour?",
  wer_gebracht: "Wer hat dich zu Parkour gebracht?",
  zukunft: "Parkour in 20 Jahren?",
};

/* Mail an Pierre. Die Datenbank ist die Liste, die Mail nur die
   Benachrichtigung: scheitert der Versand, ist der Beitrag trotzdem da. */
export async function melden(b: Beitrag) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  const angekommen = b.dateien.filter((d) => d.angekommen);
  const zeilen: [string, string][] = [
    ["Art", ARTEN[b.art] ?? b.art],
    ["Name", b.name],
    ["Kontakt", b.kontakt],
    ["Gruppe / Ort", b.gruppe_ort || "—"],
    ["Jahr(e)", b.jahre || "—"],
    ["Sprache", b.sprache.toUpperCase()],
  ];
  if (b.art !== "hinweis") {
    zeilen.push(
      ["Dateien", b.dateien.length ? `${angekommen.length} von ${b.dateien.length} angekommen` : "—"],
      ...angekommen.map((d) => ["", `${d.name} (${mb(d.groesse)})`] as [string, string]),
      ["Link", b.link || "—"],
      ["Wer ist zu sehen", b.wer_zu_sehen || "—"],
      ["Beschreibung", b.beschreibung || "—"],
    );
    if (b.offline_material) zeilen.push(["Offline", "Material liegt auf Festplatte/Kassette — melden!"]);
  } else {
    zeilen.push(["Hinweis", b.hinweis || "—"]);
    for (const [k, v] of Object.entries(b.antworten || {})) {
      if (v) zeilen.push([FRAGEN[k] ?? k, v]);
    }
  }
  zeilen.push(["Übersicht", "https://laeuft.ch/admin/parkour"]);

  const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b.kontakt) ? b.kontakt : null;

  await transporter.sendMail({
    from: `"Parkour-Doku" <${process.env.SMTP_USER}>`,
    to: ZIEL,
    ...(email ? { replyTo: `"${b.name.replace(/"/g, "")}" <${email}>` } : {}),
    subject: `Parkour-Doku — ${ARTEN[b.art] ?? b.art}: ${b.name}${b.gruppe_ort ? ` (${b.gruppe_ort})` : ""}`,
    text: zeilen.map(([k, v]) => (k ? `${k}: ${v}` : `  · ${v}`)).join("\n"),
    html: `<h2 style="font-family:sans-serif">Neuer Beitrag — Parkour-Doku</h2>
<table style="font-family:sans-serif;font-size:15px;border-collapse:collapse">
${zeilen
  .map(
    ([k, v]) =>
      `<tr><td style="padding:6px 16px 6px 0;color:#666;vertical-align:top">${escape(k)}</td><td style="padding:6px 0;white-space:pre-wrap"><b>${escape(v)}</b></td></tr>`,
  )
  .join("\n")}
</table>`,
  });
}
