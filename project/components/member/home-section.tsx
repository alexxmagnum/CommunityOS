import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type HomeSectionProps = {
  label: string
  title: string
  action?: { href: string; label: string }
  children: ReactNode
  className?: string
}

/** Encabezado + contenido con ritmo vertical consistente en la home del club. */
export function HomeSection({ label, title, action, children, className }: HomeSectionProps) {
  return (
    <section className={cn('border-t border-border/60 pt-16 first:border-t-0 first:pt-0 lg:pt-20', className)}>
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="label-caps">{label}</p>
          <h2 className="font-display mt-3 text-3xl text-foreground md:text-4xl lg:text-5xl">{title}</h2>
        </div>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 text-sm font-medium uppercase tracking-wider text-motanos hover:opacity-80"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
