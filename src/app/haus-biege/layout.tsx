import type { Metadata } from 'next'
import { HausBiegeProvider } from './PersonProvider'

export const metadata: Metadata = {
  title: 'Haus-Check – Familie Biege',
  description: 'Interner Haus-Check der Familie Biege — Inserate sammeln und gemeinsam bewerten.',
  robots: 'noindex, nofollow',
}

export default function HausBiegeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
      <HausBiegeProvider>{children}</HausBiegeProvider>
    </div>
  )
}
