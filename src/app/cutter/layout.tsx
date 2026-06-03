import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://laeuft.ch'),
  title: 'Cutter & Storyteller gesucht – läuft.ch | Pierre Biege',
  description:
    'Ich suche einen freelance Cutter & Storyteller, der Viralität versteht und mit mir Content baut, der bewegt – Shorts, Reels, Vlogs, Podcast-Clips. Ultrarunner & Content Creator aus dem Wallis.',
  keywords: [
    'Cutter gesucht', 'Video Editor', 'Social Media Freelancer', 'Videograf',
    'Reels', 'Storytelling', 'Content Creator', 'Wallis', 'Schweiz', 'Pierre Biege', 'läuft.ch',
  ],
  openGraph: {
    title: 'Cutter & Storyteller gesucht – Pierre Biege',
    description:
      'Freelance Cutter & Storyteller, der Viralität versteht und mit mir Content baut, der bewegt. Shorts, Reels, Vlogs, Podcast-Clips. 26k auf Instagram, 3M+ Aufrufe/Monat.',
    images: ['/presentations/yfood/lastsoul/05.jpg'],
    locale: 'de_CH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cutter & Storyteller gesucht – Pierre Biege',
    description: 'Freelance Cutter & Storyteller für Pierre Biege. 26k auf Instagram, 3M+ Aufrufe/Monat.',
    images: ['/presentations/yfood/lastsoul/05.jpg'],
  },
}

export default function CutterLayout({ children }: { children: React.ReactNode }) {
  return children
}
