import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { EVENT } from "./event";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${EVENT.nameLaut} — ${EVENT.gattung}, ${EVENT.zeile}`;

/* Das Bild, das in WhatsApp, Signal, Instagram-DM und Google auftaucht.
   Es benutzt Pierres eigenes Lettering und sein Foto, damit die Vorschau
   genauso aussieht wie seine Story — wer den Link bekommt, erkennt den
   Anlass, bevor er die Überschrift liest.

   Die Dateien werden direkt vom Datenträger gelesen und als Data-URI
   eingebettet: der Bildgenerator hat keinen Netzzugriff auf die eigene
   Domain, solange die Seite noch gebaut wird. */

async function dataUri(pfad: string, typ: string) {
  const bytes = await readFile(join(process.cwd(), "public", "brig-ultra", pfad));
  return `data:${typ};base64,${bytes.toString("base64")}`;
}

export default async function OgImage() {
  const [foto, lockup, absender] = await Promise.all([
    dataUri("brig-strasse-quer.jpg", "image/jpeg"),
    dataUri("lockup-50km.png", "image/png"),
    dataUri("lockup-pierre-x-stadtfitness.png", "image/png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#000",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }}
        />
        {/* Abdunklung, damit weisse Schrift auf jedem Bildteil hält.
            Der Bildgenerator rechnet keine prozentualen Masse aus `inset` —
            Breite und Höhe müssen in Pixeln dastehen, sonst fällt die Fläche
            auf null zusammen und das Foto bleibt hell. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.95) 8%, rgba(0,0,0,0.82) 34%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.45) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "52px 60px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={absender} alt="" width={340} height={23} style={{ width: 340, height: 23 }} />

          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lockup} alt="" width={720} height={296} style={{ width: 720, height: 296 }} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
                marginTop: 26,
                fontSize: 30,
                color: "#f5f3f0",
                letterSpacing: 0.5,
              }}
            >
              <div
                style={{
                  display: "flex",
                  background: "#f5f3f0",
                  color: "#000",
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: 2,
                  padding: "10px 20px",
                }}
              >
                {EVENT.domain.toUpperCase()}
              </div>
              <div style={{ display: "flex" }}>{EVENT.zeile}</div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 30,
                marginTop: 22,
                fontSize: 24,
                color: "rgba(245,243,240,0.8)",
              }}
            >
              <div style={{ display: "flex" }}>20 Runden à 2,5 km</div>
              <div style={{ display: "flex" }}>·</div>
              <div style={{ display: "flex" }}>Eine Runde reicht</div>
              <div style={{ display: "flex" }}>·</div>
              <div style={{ display: "flex" }}>Kostenlos</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
