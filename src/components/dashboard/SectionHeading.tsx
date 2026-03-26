interface SectionHeadingProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export default function SectionHeading({ title, subtitle, children }: SectionHeadingProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
