'use client'

import { Badge } from '@/components/ui/badge'
import { BRAND_TEMPLATES, type BrandTemplateId } from '@/lib/org/brand-templates'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type BrandTemplatePickerProps = {
  selectedId?: BrandTemplateId | null
  onSelect: (templateId: BrandTemplateId) => void
  compact?: boolean
  className?: string
}

export function BrandTemplatePicker({
  selectedId,
  onSelect,
  compact = false,
  className,
}: BrandTemplatePickerProps) {
  const templates = BRAND_TEMPLATES.filter((t) => t.id !== 'blank')

  return (
    <div
      className={cn(
        compact
          ? 'grid gap-2 sm:grid-cols-2'
          : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {templates.map((template) => {
        const selected = selectedId === template.id
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={cn(
              'group relative rounded-xl border p-4 text-left transition',
              selected
                ? 'border-foreground ring-2 ring-foreground/20'
                : 'hover:border-foreground/30 hover:shadow-md'
            )}
          >
            {selected && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="mb-3 flex gap-1">
              <div
                className="h-8 flex-1 rounded-md"
                style={{ backgroundColor: template.preview.primary }}
              />
              <div
                className="h-8 flex-1 rounded-md"
                style={{ backgroundColor: template.preview.secondary }}
              />
              <div
                className="h-8 flex-1 rounded-md"
                style={{ backgroundColor: template.preview.accent }}
              />
            </div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{template.name}</p>
              {template.tier === 'premium' && (
                <Badge variant="secondary" className="text-[10px]">
                  Premium
                </Badge>
              )}
            </div>
            {!compact && (
              <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
            )}
          </button>
        )
      })}
    </div>
  )
}
