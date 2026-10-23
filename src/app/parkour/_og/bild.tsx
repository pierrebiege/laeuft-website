import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { KANTONE, KARTE_BREITE, KARTE_HOEHE, LAND, ORTE, SEEN } from "../karte-daten";
import { TEXTE, type Sprache } from "../texte";
import { titelZeilen } from "../titel";
import { ZUSATZ } from "../texte-zusatz";

/* Vorschaubild für WhatsApp & Co.: riesiger Titel, der ins Bildfenster
   mit der Karte hineinragt, darunter «Die Doku» und die Adresse. Schriften liegen als TTF neben dieser Datei,
   weil der Bildgenerator beim Bauen keinen Netzzugriff hat. */

export const OG_GROESSE = { width: 1200, height: 630 };

const ORDNER = join(process.cwd(), "src", "app", "parkour", "_og");

export async function ogBild(sprache: Sprache) {
  const t = TEXTE[sprache];
  const [schmal, normal] = await Promise.all([
    readFile(join(ORDNER, "archivo-condensed-800.ttf")),
    readFile(join(ORDNER, "archivo-500.ttf")),
  ]);
  const kartenBreite = 900;
  const kartenHoehe = Math.round((kartenBreite * KARTE_HOEHE) / KARTE_BREITE);

  const zeilen = titelZeilen(t.hero.titel.join(" "));
  const gross = sprache === "de" ? 196 : 176;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f3f2ee",
          position: "relative",
          fontFamily: "Normal",
          overflow: "hidden",
        }}
      >
        {/* Bildfenster rechts, randlos, mit allen belegten Orten */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 40,
            width: 520,
            height: 550,
            display: "flex",
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          <svg
            width={kartenBreite}
            height={kartenHoehe}
            viewBox={`0 0 ${KARTE_BREITE} ${KARTE_HOEHE}`}
            style={{ position: "absolute", left: -150, top: 0 }}
          >
            <path d={LAND} fill="#e6e4de" />
            <path d={KANTONE} fill="none" stroke="#ffffff" strokeWidth={1.6} />
            <path d={SEEN} fill="#ffffff" />
            <path d={LAND} fill="none" stroke="#1b1b1a" strokeWidth={2} />
            {ORTE.map((o) => (
              <circle key={o.name} cx={o.x} cy={o.y} r={10} fill="#e0431e" />
            ))}
          </svg>
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              display: "flex",
              alignItems: "baseline",
              padding: "12px 20px 14px 24px",
              background: "#ffffff",
            }}
          >
            <span style={{ fontFamily: "Schmal", fontSize: 64, lineHeight: 1, color: "#1b1b1a" }}>2026</span>
            <span style={{ marginLeft: 14, fontSize: 24, color: "#e0431e" }}>
              {ZUSATZ[sprache].karte.orte(ORTE.length)}
            </span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 60,
            top: 34,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Schmal",
            fontSize: gross,
            lineHeight: 0.84,
            letterSpacing: -5,
            color: "#1b1b1a",
          }}
        >
          {zeilen.map((z, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", paddingLeft: i * 70 }}>
              {z.klein ? (
                <span style={{ fontFamily: "Normal", fontSize: 40, letterSpacing: 0, marginTop: 22, marginRight: 14 }}>
                  {z.klein}
                </span>
              ) : null}
              <span>{z.gross}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 44,
            display: "flex",
            flexDirection: "column",
            width: 560,
          }}
        >
          <div style={{ display: "flex", fontSize: 30, lineHeight: 1.25, color: "#1b1b1a" }}>{t.hero.arbeitstitel}</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 22, color: "#5d5b56" }}>{`laeuft.ch${t.pfad}`}</div>
        </div>
      </div>
    ),
    {
      ...OG_GROESSE,
      fonts: [
        { name: "Schmal", data: schmal, weight: 800, style: "normal" },
        { name: "Normal", data: normal, weight: 500, style: "normal" },
      ],
    },
  );
}
