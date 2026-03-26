'use client'

import { Mail, ArrowRight } from 'lucide-react'
import type { DashboardConfig } from '@/lib/instagram-types'

interface ContactCTAProps {
  config: DashboardConfig
}

export default function ContactCTA({ config }: ContactCTAProps) {
  return (
    <section className="text-center py-12 sm:py-16">
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
        {config.contact_cta_text || 'Interesse an einer Zusammenarbeit?'}
      </h2>
      <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">
        Ich freue mich auf deine Nachricht. Lass uns gemeinsam etwas bewegen.
      </p>
      <a
        href={`mailto:${config.contact_email || 'pierre@laeuft.ch'}`}
        className="inline-flex items-center gap-2 bg-white text-zinc-950 font-semibold text-sm px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors"
      >
        <Mail size={16} />
        Kontakt aufnehmen
        <ArrowRight size={14} />
      </a>
    </section>
  )
}
