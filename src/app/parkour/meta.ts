import type { Metadata } from "next";
import { TEXTE, type Sprache } from "./texte";

/* Das Vorschaubild ist ein fertiges PNG aus ~/Documents/parkour-doku/teilen/baue_vorschau.py
   (gerendert in Chrome, wegen der Tuschelinien). Nach einer Änderung VERSION erhöhen,
   sonst zeigt WhatsApp das alte Bild aus dem Cache. */
const VERSION = 2;

export function metadaten(sprache: Sprache): Metadata {
  const t = TEXTE[sprache];
  const bild = {
    url: `/parkour/og-${sprache}.png?v=${VERSION}`,
    width: 1200,
    height: 630,
    alt: t.meta.ogTitel,
  };
  return {
    title: t.meta.titel,
    description: t.meta.beschreibung,
    alternates: {
      canonical: t.pfad,
      languages: { "de-CH": "/parkour", "fr-CH": "/parkour/fr" },
    },
    openGraph: {
      type: "website",
      locale: sprache === "de" ? "de_CH" : "fr_CH",
      url: t.pfad,
      siteName: t.meta.titel,
      title: t.meta.ogTitel,
      description: t.meta.ogZeile,
      images: [bild],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.ogTitel,
      description: t.meta.ogZeile,
      images: [bild],
    },
  };
}
