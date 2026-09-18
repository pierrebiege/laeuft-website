import { EVENT } from "../event";

/* sitemap.xml für 50kmbrig.ch. Die Eventseite plus die zwei Rechtsseiten. */

export const dynamic = "force-static";

export function GET() {
  const heute = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://${EVENT.domain}/</loc>
    <lastmod>${heute}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://${EVENT.domain}/brig-ultra/brig-strasse-quer.jpg</image:loc>
      <image:title>50 km Brig — Ultra Community Run</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://${EVENT.domain}/impressum</loc>
    <lastmod>${heute}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>
  <url>
    <loc>https://${EVENT.domain}/datenschutz</loc>
    <lastmod>${heute}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
