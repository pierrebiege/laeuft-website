import { ImageResponse } from "next/og";
import { EVENT } from "./event";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${EVENT.nameLaut} — ${EVENT.gattung}`;

/* Das Vorschaubild für WhatsApp, Instagram und Google. Bewusst nur Typo:
   der Name, das Datum, die Zahlen. Der Name ist gleichzeitig die Adresse —
   wer das Bild sieht, weiss, was er tippen muss. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          color: "#f7f4f1",
          padding: "60px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: "rgba(247,244,241,0.6)" }}>
          PIERRE × STADTFITNESS BRIG
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <div style={{ display: "flex", fontSize: 168, fontWeight: 800, lineHeight: 1, letterSpacing: -8 }}>
              50
            </div>
            <div style={{ display: "flex", fontSize: 62, fontWeight: 800, letterSpacing: -2, color: "#d07050" }}>
              km
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 168,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: -8,
                marginLeft: 28,
              }}
            >
              BRIG
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 44, marginTop: 20, letterSpacing: -1 }}>
            {EVENT.claim} <span style={{ color: "#d07050", marginLeft: 12 }}>{EVENT.claimZwei}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 44,
            fontSize: 28,
            borderTop: "1px solid rgba(247,244,241,0.2)",
            paddingTop: 26,
          }}
        >
          <div style={{ display: "flex" }}>{EVENT.datumKurz}</div>
          <div style={{ display: "flex" }}>8–18 UHR</div>
          <div style={{ display: "flex" }}>10 STUNDEN</div>
          <div style={{ display: "flex", color: "#d07050" }}>KOSTENLOS</div>
        </div>
      </div>
    ),
    size
  );
}
