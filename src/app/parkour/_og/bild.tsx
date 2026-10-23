import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { KANTONE, KARTE_BREITE, KARTE_HOEHE, LAND, ORTE, SEEN } from "../karte-daten";
import { TEXTE, type Sprache } from "../texte";

/* Vorschaubild für WhatsApp & Co.: Titel links, die Schweiz mit allen
   belegten Orten rechts. Schriften liegen als TTF neben dieser Datei,
   weil der Bildgenerator beim Bauen keinen Netzzugriff hat. */

export const OG_GROESSE = { width: 1200, height: 630 };

const ORDNER = join(process.cwd(), "src", "app", "parkour", "_og");

export async function ogBild(sprache: Sprache) {
  const t = TEXTE[sprache];
  const [schmal, normal] = await Promise.all([
    readFile(join(ORDNER, "archivo-condensed-800.ttf")),
    readFile(join(ORDNER, "archivo-500.ttf")),
  ]);
  const kartenBreite = 640;
  const kartenHoehe = Math.round((kartenBreite * KARTE_HOEHE) / KARTE_BREITE);

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
        }}
      >
        <svg
          width={kartenBreite}
          height={kartenHoehe}
          viewBox={`0 0 ${KARTE_BREITE} ${KARTE_HOEHE}`}
          style={{ position: "absolute", right: -40, top: 150 }}
        >
          <path d={LAND} fill="#e6e4de" />
          <path d={KANTONE} fill="none" stroke="#cfccc4" strokeWidth={1.4} />
          <path d={SEEN} fill="#f3f2ee" />
          <path d={LAND} fill="none" stroke="#1b1b1a" strokeWidth={2} />
          {ORTE.map((o) => (
            <circle key={o.name} cx={o.x} cy={o.y} r={9} fill="#e0431e" />
          ))}
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "64px 0 0 72px",
            width: 760,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Schmal",
              fontSize: sprache === "de" ? 118 : 100,
              lineHeight: 0.92,
              letterSpacing: -2,
              color: "#1b1b1a",
            }}
          >
            <span>{t.hero.titel[0]}</span>
            <span style={{ paddingLeft: 80 }}>{t.hero.titel[1]}</span>
          </div>
          <div style={{ display: "flex", marginTop: 40, fontSize: 30, lineHeight: 1.3, color: "#4b4a46", width: 560 }}>
            {t.meta.ogZeile}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 72,
            bottom: 54,
            display: "flex",
            fontSize: 24,
            color: "#1b1b1a",
          }}
        >
          {`laeuft.ch${t.pfad}`}
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
