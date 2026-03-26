import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Media Kit — Pierre Biege',
  description: 'Instagram Insights & Performance Dashboard',
  robots: 'noindex, nofollow',
}

export default function DashboardLayout({
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
