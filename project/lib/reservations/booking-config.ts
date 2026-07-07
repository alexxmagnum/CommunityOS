export interface BookingConfig {
  duration_minutes?: number
  price_per_hour?: number
  open_hour?: number
  close_hour?: number
  slot_interval_minutes?: number
  max_advance_days?: number
}

const DEFAULTS: Required<BookingConfig> = {
  duration_minutes: 60,
  price_per_hour: 0,
  open_hour: 8,
  close_hour: 22,
  slot_interval_minutes: 60,
  max_advance_days: 30,
}

export function parseBookingConfig(raw: unknown): Required<BookingConfig> {
  const config = (raw && typeof raw === 'object' ? raw : {}) as BookingConfig
  return {
    duration_minutes: config.duration_minutes ?? DEFAULTS.duration_minutes,
    price_per_hour: config.price_per_hour ?? DEFAULTS.price_per_hour,
    open_hour: config.open_hour ?? DEFAULTS.open_hour,
    close_hour: config.close_hour ?? DEFAULTS.close_hour,
    slot_interval_minutes: config.slot_interval_minutes ?? config.duration_minutes ?? DEFAULTS.slot_interval_minutes,
    max_advance_days: config.max_advance_days ?? DEFAULTS.max_advance_days,
  }
}

export function isDateBookable(dateStr: string, config: Required<BookingConfig>): boolean {
  const date = new Date(`${dateStr}T12:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const max = new Date(today)
  max.setDate(max.getDate() + config.max_advance_days)
  return date >= today && date <= max
}
