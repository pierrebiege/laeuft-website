import { EVENT } from "../event";

/* robots.txt für 50kmbrig.ch. Die Domain bekommt eine eigene, weil sie im
   selben Projekt wie laeuft.ch liegt: next.config.ts schreibt /robots.txt auf
   diesen Pfad um, sodass laeuft.ch davon unberührt bleibt.
   Alles offen, plus der Verweis auf die Sitemap — mehr braucht eine Seite
   mit einer einzigen URL nicht. */

export const dynamic = "force-static";

export function GET() {
  const text = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Die Seite hat genau eine URL. Nichts davon ist gesperrt.",
    `Sitemap: https://${EVENT.domain}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
