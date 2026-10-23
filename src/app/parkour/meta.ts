import type { Metadata } from "next";
import { TEXTE, type Sprache } from "./texte";

/* Das Vorschaubild kommt aus opengraph-image.tsx (DE) bzw. fr/opengraph-image.tsx. */
export function metadaten(sprache: Sprache): Metadata {
  const t = TEXTE[sprache];
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
      siteName: "laeuft.ch",
      title: t.meta.ogTitel,
      description: t.meta.ogZeile,
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.ogTitel,
      description: t.meta.ogZeile,
    },
  };
}
