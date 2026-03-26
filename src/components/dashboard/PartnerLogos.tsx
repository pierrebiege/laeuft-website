'use client'

import type { PartnerLogo } from '@/lib/instagram-types'
import SectionHeading from './SectionHeading'

interface PartnerLogosProps {
  logos: PartnerLogo[]
}

export default function PartnerLogos({ logos }: PartnerLogosProps) {
  if (!logos.length) return null

  return (
    <section>
      <SectionHeading title="Partner" subtitle="Aktuelle Zusammenarbeiten" />
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 py-8 bg-zinc-900/60 border border-zinc-800 rounded-lg">
        {logos.map((logo) => (
          <a
            key={logo.name}
            href={logo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            {logo.image_url ? (
              <img
                src={logo.image_url}
                alt={logo.name}
                className="h-10 sm:h-12 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
              />
            ) : (
              <span className="text-sm font-bold text-zinc-500 group-hover:text-white transition-colors tracking-wider uppercase">
                {logo.name}
              </span>
            )}
          </a>
        ))}
      </div>
    </section>
  )
}
