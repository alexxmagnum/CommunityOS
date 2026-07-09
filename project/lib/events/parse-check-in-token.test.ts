import { describe, expect, it } from 'vitest'
import { parseCheckInToken } from '@/lib/events/parse-check-in-token'
import {
  hasReminderBeenSent,
  isWithinReminderWindow,
  withReminderSent,
} from '@/lib/events/reminder-windows'

describe('parseCheckInToken', () => {
  it('acepta token hex directo', () => {
    expect(parseCheckInToken('a1b2c3d4e5f67890')).toBe('a1b2c3d4e5f67890')
  })

  it('extrae token de URL de acreditación', () => {
    expect(parseCheckInToken('http://localhost:3000/o/ikon/acreditacion/abc123def4567890')).toBe(
      'abc123def4567890'
    )
  })

  it('extrae token de deep link legacy', () => {
    expect(parseCheckInToken('ikon://checkin/feedface12345678')).toBe('feedface12345678')
  })

  it('rechaza texto inválido', () => {
    expect(parseCheckInToken('hola')).toBeNull()
  })
})

describe('reminder windows', () => {
  const eventStart = new Date('2026-07-10T18:00:00.000Z')

  it('detecta ventana de 24h', () => {
    const now = new Date('2026-07-09T18:00:00.000Z')
    expect(isWithinReminderWindow(eventStart, now, '24h')).toBe(true)
    expect(isWithinReminderWindow(eventStart, now, '1h')).toBe(false)
  })

  it('detecta ventana de 1h', () => {
    const now = new Date('2026-07-10T17:00:00.000Z')
    expect(isWithinReminderWindow(eventStart, now, '1h')).toBe(true)
  })

  it('marca recordatorio enviado en metadata', () => {
    const next = withReminderSent({}, '24h', new Date('2026-07-09T12:00:00.000Z'))
    expect(hasReminderBeenSent(next, '24h')).toBe(true)
    expect(hasReminderBeenSent(next, '1h')).toBe(false)
  })
})
