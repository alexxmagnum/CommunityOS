import Link from 'next/link'

export function EmptySection({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-4 inline-block text-sm font-medium text-motanos hover:underline">
          {actionLabel} →
        </Link>
      )}
    </div>
  )
}
