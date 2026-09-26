import type { NextConfig } from "next";

const TEAM_HOSTS = ["swiss-backyardultra.ch", "www.swiss-backyardultra.ch"];

// Die eigene Domain des Community-Ultras. Sie liefert /brig-ultra aus, ohne
// dass der Pfad je sichtbar wird — der Name der Seite ist die Adresse.
const BRIG_HOSTS = ["50kmbrig.ch", "www.50kmbrig.ch"];

// Auf true stellen, sobald 50kmbrig.ch im Vercel-Projekt hängt und die DNS
// greift. Dann schickt laeuft.ch/brig-ultra alle alten Links auf die Domain,
// und die Seite ist nur noch unter ihrem eigenen Namen zu sehen. Vorher muss
// es false bleiben — sonst zeigt der Redirect ins Leere.
const BRIG_DOMAIN_LIVE = true;

const nextConfig: NextConfig = {
  async rewrites() {
    // Die Team-Domain liefert die Backyard-Seite selbst aus: jeder Pfad ohne
    // Punkt (also Seiten, keine Dateien) wird intern auf /backyard/… gemappt.
    // beforeFiles, damit «/» auf der Team-Domain nicht die laeuft.ch-Startseite
    // trifft. /api bleibt unberührt, damit das Live-Board seine Daten holt.
    return {
      beforeFiles: [
        // Graatzug Backyard Ultra Simplon: statische Seite unter public/graatzug/.
        // Die Seite setzt <base href="/graatzug/">, damit Bilder und Skripte
        // auch ohne Schrägstrich am Ende gefunden werden.
        { source: "/graatzug", destination: "/graatzug/index.html" },
        // Themenseiten: /graatzug/<slug> → public/graatzug/<slug>/index.html
        { source: "/graatzug/:slug([a-z0-9-]+)", destination: "/graatzug/:slug/index.html" },
        ...TEAM_HOSTS.flatMap((host) => [
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
        // 50kmbrig.ch: die Startseite ist die Eventseite. /api und /_next
        // bleiben unberührt, damit das Anmeldeformular seine Route erreicht.
        // robots.txt und sitemap.xml haben eigene Handler unterhalb von
        // /brig-ultra — so bekommt die Domain ihre eigenen, ohne dass
        // laeuft.ch welche aufgedrängt bekommt.
        ...BRIG_HOSTS.flatMap((host) => [
          {
            source: "/",
            has: [{ type: "host" as const, value: host }],
            destination: "/brig-ultra",
          },
          {
            source: "/robots.txt",
            has: [{ type: "host" as const, value: host }],
            destination: "/brig-ultra/robots",
          },
          {
            source: "/sitemap.xml",
            has: [{ type: "host" as const, value: host }],
            destination: "/brig-ultra/sitemap",
          },
          // Impressum und Datenschutz gehören zum Anlass, nicht zu laeuft.ch:
          // der Anlass hat zwei Veranstalter und eine eigene Datenbearbeitung.
          {
            source: "/impressum",
            has: [{ type: "host" as const, value: host }],
            destination: "/brig-ultra/impressum",
          },
          {
            source: "/datenschutz",
            has: [{ type: "host" as const, value: host }],
            destination: "/brig-ultra/datenschutz",
          },
        ]),
      ],
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
    // 50kmbrig.ch/anmelden ist die Adresse, die sich im Video sagen lässt.
    // Sie springt auf derselben Seite zum Formular.
    const anmeldung = [
      ...BRIG_HOSTS.map((host) => ({
        source: "/anmelden",
        has: [{ type: "host" as const, value: host }],
        destination: "/#anmelden",
        permanent: false,
      })),
      // Auf der Domain soll der interne Pfad nicht erreichbar bleiben.
      // Wie bei der Team-Domain sind das Vorschaubild und das Icon
      // ausgenommen: Share-Scraper folgen Redirects auf og:image oft nicht.
      ...BRIG_HOSTS.flatMap((host) => [
        {
          source: "/brig-ultra",
          has: [{ type: "host" as const, value: host }],
          destination: "/",
          permanent: false,
        },
        {
          source: "/brig-ultra/:pfad((?!opengraph-image|icon)[^.]+)",
          has: [{ type: "host" as const, value: host }],
          destination: "/",
          permanent: false,
        },
      ]),
      // Alte Links aus Chats und Stories.
      {
        source: "/brig-ultra/anmelden",
        destination: BRIG_DOMAIN_LIVE ? "https://50kmbrig.ch/#anmelden" : "/brig-ultra#anmelden",
        permanent: false,
      },
      // Sobald die Domain steht: laeuft.ch/brig-ultra gibt es nicht mehr,
      // alles läuft über 50kmbrig.ch. Das Vorschaubild bleibt ausgenommen,
      // damit geteilte Links in WhatsApp weiter ein Bild zeigen.
      ...(BRIG_DOMAIN_LIVE
        ? ["laeuft.ch", "www.laeuft.ch"].flatMap((host) => [
            {
              source: "/brig-ultra",
              has: [{ type: "host" as const, value: host }],
              destination: "https://50kmbrig.ch/",
              permanent: false,
            },
            {
              source: "/brig-ultra/:pfad((?!opengraph-image|icon)[^.]+)",
              has: [{ type: "host" as const, value: host }],
              destination: "https://50kmbrig.ch/",
              permanent: false,
            },
          ])
        : []),
    ];
    return [...renamed, ...toTeam, ...strip, ...anmeldung];
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
        // Die 3D-Szenen dürfen same-origin in ihre eigene Seite eingebettet
        // werden: Goms in /goms, die WM-Strecke in /backyard/course.
        source: "/goms/scene.html",
        headers: [...base, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        source: "/backyard/course/scene.html",
        headers: [...base, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        // Die Entwurfsvorschau für Keller ImmoVermarktung zeigt Webseite,
        // Bautafel und Posts in iframes derselben Herkunft.
        source: "/keller/:pfad*",
        headers: [...base, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        // Graatzug: die 3D-Runde am Simplon läuft in einem iframe derselben Herkunft.
        source: "/graatzug/course-simplon/scene.html",
        headers: [...base, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        // Rest der Seite: kein Framing erlaubt
        source: "/((?!goms/scene\\.html|backyard/course/scene\\.html|keller/|graatzug/course-simplon/scene\\.html).*)",
        headers: [...base, { key: "X-Frame-Options", value: "DENY" }],
      },
    ];
  },
};

export default nextConfig;
