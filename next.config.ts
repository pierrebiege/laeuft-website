import type { NextConfig } from "next";

const TEAM_HOSTS = ["swiss-backyardultra.ch", "www.swiss-backyardultra.ch"];

const nextConfig: NextConfig = {
  async rewrites() {
    // Die Team-Domain liefert die Backyard-Seite selbst aus: jeder Pfad ohne
    // Punkt (also Seiten, keine Dateien) wird intern auf /backyard/… gemappt.
    // beforeFiles, damit «/» auf der Team-Domain nicht die laeuft.ch-Startseite
    // trifft. /api bleibt unberührt, damit das Live-Board seine Daten holt.
    return {
      beforeFiles: TEAM_HOSTS.flatMap((host) => [
        {
          source: "/",
          has: [{ type: "host" as const, value: host }],
          destination: "/backyard",
        },
        {
          source: "/:path((?!api/|backyard|_next/)[^.]+)",
          has: [{ type: "host" as const, value: host }],
          destination: "/backyard/:path",
        },
      ]),
    };
  },
  async redirects() {
    // Die Backyard-Seite lief zwei Tage mit deutschen Pfaden, bevor das Team
    // auf Englisch umgestellt hat. Alte Links aus dem Chat sollen weiter gehen.
    const renamed = [
      { source: "/backyard/welt", destination: "/backyard/world", permanent: true },
      { source: "/backyard/team", destination: "/backyard/squad", permanent: true },
      { source: "/backyard/strecke", destination: "/backyard/course", permanent: true },
      { source: "/backyard/format", destination: "/backyard/rules", permanent: true },
    ];
    // laeuft.ch/backyard → Team-Domain. Die Seite soll nur dort erreichbar
    // sein; 307 statt 308, damit nichts in Browser-Caches festhängt.
    const toTeam = ["laeuft.ch", "www.laeuft.ch"].map((host) => ({
      source: "/backyard/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://swiss-backyardultra.ch/:path*",
      permanent: false,
    }));
    // Auf der Team-Domain das /backyard-Präfix aus Seiten-URLs streichen.
    // Dateien (mit Punkt) und die generierten Bilder bleiben direkt erreichbar,
    // weil Share-Scraper Redirects auf og:image oft nicht folgen.
    const strip = TEAM_HOSTS.flatMap((host) => [
      {
        source: "/backyard",
        has: [{ type: "host" as const, value: host }],
        destination: "/",
        permanent: false,
      },
      {
        source: "/backyard/:path((?!opengraph-image|icon)[^.]+)",
        has: [{ type: "host" as const, value: host }],
        destination: "/:path",
        permanent: false,
      },
    ]);
    return [...renamed, ...toTeam, ...strip];
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
