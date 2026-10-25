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
      /* Für die Suche ist Englisch die Hauptfassung (x-default). */
      languages: { "de-CH": "/parkour", "fr-CH": "/parkour/fr", en: "/parkour/en", "x-default": "/parkour/en" },
    },
    openGraph: {
      type: "website",
      locale: { de: "de_CH", fr: "fr_CH", en: "en_GB" }[sprache],
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
