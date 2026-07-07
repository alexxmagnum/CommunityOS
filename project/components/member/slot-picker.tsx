'use client'

import { cn } from '@/lib/utils'
import type { AvailableSlot } from '@/lib/reservations/availability'

interface SlotPickerProps {
  slots: AvailableSlot[]
  value: string | null
  onChange: (slot: AvailableSlot) => void
  loading?: boolean
}

export function SlotPicker({ slots, value, onChange, loading }: SlotPickerProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando horarios...</p>
  }

  const available = slots.filter((s) => s.available)
  if (!slots.length) {
    return <p className="text-sm text-muted-foreground">No hay horarios para este día.</p>
  }
  if (!available.length) {
    return <p className="text-sm text-muted-foreground">No quedan huecos libres este día.</p>
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          disabled={!slot.available}
          onClick={() => onChange(slot)}
          className={cn(
            'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
            !slot.available && 'cursor-not-allowed border-border/50 text-muted-foreground/40 line-through',
            slot.available && value !== slot.id && 'border-border bg-background hover:border-[color:var(--org-accent)] hover:bg-[color:var(--org-accent)]/5',
            slot.available && value === slot.id && 'border-[color:var(--org-accent)] bg-[color:var(--org-accent)]/15 text-[color:var(--org-primary)]'
          )}
        >
          {slot.label}
        </button>
      ))}
    </div>
  )
}
