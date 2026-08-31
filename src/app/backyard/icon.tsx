import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#e1000f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", display: "flex", width: 40, height: 40 }}>
          <div style={{ position: "absolute", left: 16, top: 4, width: 8, height: 32, background: "#fff" }} />
          <div style={{ position: "absolute", left: 4, top: 16, width: 32, height: 8, background: "#fff" }} />
        </div>
      </div>
    ),
    size,
  );
}
