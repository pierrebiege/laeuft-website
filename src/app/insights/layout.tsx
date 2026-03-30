import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Instagram Insights — Pierre Biege | @pierrebiege',
  description: 'Live Instagram Performance Daten von Pierre Biege. Ultrarunner & Content Creator aus dem Wallis. 18k+ Follower, 1M+ monatliche Aufrufe.',
  openGraph: {
    title: 'Instagram Insights — Pierre Biege',
    description: 'Live Performance Daten: 18k+ Follower, 1M+ Aufrufe/Monat. Ultrarunner & Content Creator aus dem Wallis.',
    images: ['/insights/hero-trail.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Insights — Pierre Biege',
    description: 'Live Performance Daten: 18k+ Follower, 1M+ Aufrufe/Monat.',
    images: ['/insights/hero-trail.jpg'],
  },
  robots: 'noindex, nofollow',
}

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {children}
    </div>
  )
}
