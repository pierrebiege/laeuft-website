import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      {
        // 3D-Goms-Szene darf same-origin in die /goms-Seite eingebettet werden
        source: "/goms/scene.html",
        headers: [...base, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        // Rest der Seite: kein Framing erlaubt
        source: "/((?!goms/scene\\.html).*)",
        headers: [...base, { key: "X-Frame-Options", value: "DENY" }],
      },
    ];
  },
};

export default nextConfig;
