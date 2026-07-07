import { parseBookingConfig } from './booking-config'

export interface AvailableSlot {
  id: string
  startIso: string
  endIso: string
  label: string
  available: boolean
}

export interface ExistingReservation {
  start_time: string
  end_time: string | null
  status?: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function generateDaySlots(
  dateStr: string,
  rawConfig: unknown,
  existing: ExistingReservation[],
  now = new Date()
): AvailableSlot[] {
  const config = parseBookingConfig(rawConfig)
  const slots: AvailableSlot[] = []
  const active = existing.filter((r) => !r.status || ['pending', 'confirmed'].includes(r.status))

  for (let hour = config.open_hour; hour < config.close_hour; hour++) {
    for (let minute = 0; minute < 60; minute += config.slot_interval_minutes) {
      const endMinutes = hour * 60 + minute + config.duration_minutes
      const endHour = Math.floor(endMinutes / 60)
      const endMinute = endMinutes % 60
      if (endHour > config.close_hour || (endHour === config.close_hour && endMinute > 0)) {
        continue
      }

      const startIso = `${dateStr}T${pad(hour)}:${pad(minute)}:00`
      const start = new Date(startIso)
      const end = new Date(start.getTime() + config.duration_minutes * 60_000)
      const endIso = end.toISOString()

      const taken = active.some((r) => {
        const rStart = new Date(r.start_time)
        const rEnd = r.end_time ? new Date(r.end_time) : new Date(rStart.getTime() + config.duration_minutes * 60_000)
        return overlaps(start, end, rStart, rEnd)
      })

      const inPast = start <= now
      const label = `${pad(hour)}:${pad(minute)}`

      slots.push({
        id: startIso,
        startIso,
        endIso,
        label,
        available: !taken && !inPast,
      })
    }
  }

  return slots
}

export function generateDemoSlots(dateStr: string): AvailableSlot[] {
  const config = parseBookingConfig({
    open_hour: 9,
    close_hour: 20,
    slot_interval_minutes: 60,
    duration_minutes: 60,
  })
  return generateDaySlots(dateStr, config, [])
}
