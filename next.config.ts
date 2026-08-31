import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Die Team-Domain swiss-backyardultra.ch (DNS bei Hostpoint, A-Record auf
    // Vercel) führt direkt auf die Backyard-Seite. Bewusst 307, nicht 308 –
    // falls die Domain die Seite später selbst ausliefern soll, hängt sie in
    // keinem Browser-Cache fest.
    const teamHosts = ["swiss-backyardultra.ch", "www.swiss-backyardultra.ch"];
    const teamRedirects = teamHosts.flatMap((host) => [
      {
        source: "/backyard/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://laeuft.ch/backyard/:path*",
        permanent: false,
      },
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://laeuft.ch/backyard/:path*",
        permanent: false,
      },
    ]);
    // Die Backyard-Seite lief zwei Tage mit deutschen Pfaden, bevor das Team
    // auf Englisch umgestellt hat. Alte Links aus dem Chat sollen weiter gehen.
    return [
      ...teamRedirects,
      { source: "/backyard/welt", destination: "/backyard/world", permanent: true },
      { source: "/backyard/team", destination: "/backyard/squad", permanent: true },
      { source: "/backyard/strecke", destination: "/backyard/course", permanent: true },
      { source: "/backyard/format", destination: "/backyard/rules", permanent: true },
    ];
  },
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
