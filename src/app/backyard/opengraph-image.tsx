import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Team Switzerland · Backyard Ultra World Team Championship 2026";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000",
          color: "#f4f4f6",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative", display: "flex", width: 44, height: 44, background: "#e1000f", borderRadius: 10 }}>
            <div style={{ position: "absolute", left: 19, top: 9, width: 6, height: 26, background: "#fff" }} />
            <div style={{ position: "absolute", left: 9, top: 19, width: 26, height: 6, background: "#fff" }} />
          </div>
          <div style={{ fontSize: 26, letterSpacing: 4, color: "#8b8b96" }}>TEAM SWITZERLAND</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", fontSize: 82, fontWeight: 700, letterSpacing: -3, lineHeight: 1.03 }}>
          <div>Last one standing.</div>
          <div style={{ color: "#8b8b96" }}>One loop.</div>
          <div>Every hour.</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#8b8b96" }}>
          <div>Sat 17 October 2026 · 14:00 · Baar ZG</div>
          <div style={{ color: "#e1000f" }}>Backyard Ultra World Team Championship</div>
        </div>
      </div>
    ),
    size,
  );
}
