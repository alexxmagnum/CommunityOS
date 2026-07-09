export interface SportBookingRules {
  min_players?: number
  max_players?: number
  slot_minutes?: number
  advance_booking_days?: number
  cancellation_hours?: number
  members_only?: boolean
  peak_surcharge_percent?: number
}

export interface SportWithRules {
  id: string
  name: string
  display_name: string | null
  rules: SportBookingRules
}

export const DEFAULT_SPORT_RULES: SportBookingRules = {
  min_players: 1,
  max_players: 4,
  slot_minutes: 60,
  advance_booking_days: 14,
  cancellation_hours: 24,
  members_only: false,
  peak_surcharge_percent: 0,
}

export const DEMO_SPORT_RULES: Record<string, SportBookingRules> = {
  golf: {
    min_players: 1,
    max_players: 4,
    slot_minutes: 90,
    advance_booking_days: 30,
    cancellation_hours: 48,
    members_only: true,
    peak_surcharge_percent: 15,
  },
  padel: {
    min_players: 2,
    max_players: 4,
    slot_minutes: 60,
    advance_booking_days: 7,
    cancellation_hours: 12,
    members_only: false,
    peak_surcharge_percent: 10,
  },
  paddle: {
    min_players: 1,
    max_players: 2,
    slot_minutes: 60,
    advance_booking_days: 3,
    cancellation_hours: 6,
    members_only: false,
    peak_surcharge_percent: 0,
  },
}

export function resolveSportRules(sportName?: string | null, stored?: SportBookingRules | null): SportBookingRules {
  if (stored && Object.keys(stored).length) {
    return { ...DEFAULT_SPORT_RULES, ...stored }
  }
  if (sportName && DEMO_SPORT_RULES[sportName]) {
    return { ...DEFAULT_SPORT_RULES, ...DEMO_SPORT_RULES[sportName] }
  }
  return { ...DEFAULT_SPORT_RULES }
}

export function applyPeakSurcharge(basePrice: number, rules: SportBookingRules, isPeak: boolean): number {
  if (!isPeak || !rules.peak_surcharge_percent) return basePrice
  return basePrice * (1 + rules.peak_surcharge_percent / 100)
}
