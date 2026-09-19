import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pt-6 pb-4">
      <div className="min-w-0">
        <h1 className="text-[22px] leading-tight font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
