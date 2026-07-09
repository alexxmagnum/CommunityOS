import type { EventReminderKind } from '@/lib/email/event-reminder-template'

const HOUR_MS = 60 * 60 * 1000

/** Ventana de ±30 min alrededor del objetivo (pensado para cron horario). */
export function isWithinReminderWindow(
  eventStartsAt: Date,
  now: Date,
  kind: EventReminderKind
): boolean {
  const targetOffsetMs = kind === '24h' ? 24 * HOUR_MS : HOUR_MS
  const diffMs = eventStartsAt.getTime() - now.getTime()
  const margin = 30 * 60 * 1000
  return diffMs >= targetOffsetMs - margin && diffMs <= targetOffsetMs + margin
}

type ReminderMetadata = {
  reminders?: Partial<Record<EventReminderKind, string>>
}

export function hasReminderBeenSent(metadata: unknown, kind: EventReminderKind): boolean {
  if (!metadata || typeof metadata !== 'object') return false
  const reminders = (metadata as ReminderMetadata).reminders
  return Boolean(reminders?.[kind])
}

export function withReminderSent(metadata: unknown, kind: EventReminderKind, sentAt: Date) {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {}

  const reminders =
    base.reminders && typeof base.reminders === 'object' && !Array.isArray(base.reminders)
      ? { ...(base.reminders as Record<string, unknown>) }
      : {}

  reminders[kind] = sentAt.toISOString()

  return { ...base, reminders }
}
