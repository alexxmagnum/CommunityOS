/** Catálogo de etiquetas de sistema — Deutsch */

export const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Veranstaltung',
  experience: 'Erlebnis',
  tournament: 'Turnier',
  workshop: 'Workshop',
  social: 'Treffen',
  competition: 'Wettkampf',
}

export const ROLE_LABELS: Record<string, string> = {
  org_owner: 'Clubbesitzer',
  org_admin: 'Clubadministrator',
  org_member: 'Mitglied',
}

export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  owner: 'Inhaber',
  admin: 'Administrator',
  support: 'Support',
  viewer: 'Nur Lesen',
}

export const SPORT_NAME_LABELS: Record<string, string> = {
  golf: 'Golf',
  padel: 'Padel',
  paddle: 'Paddelboarding',
  tennis: 'Tennis',
  football: 'Fußball',
  basketball: 'Basketball',
  swimming: 'Schwimmen',
  billiards: 'Billard',
  pickleball: 'Pickleball',
  pitch_and_putt: 'Pitch & Putt',
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  reservation: 'Buchung',
  event_join: 'Veranstaltungsanmeldung',
  tournament_win: 'Turniersieg',
  tournament_join: 'Turnieranmeldung',
  member_join: 'Neues Mitglied',
  achievement: 'Erfolg',
}

export const HERO_STYLE_LABELS: Record<string, string> = {
  standard: 'Standard',
  cinematic: 'Filmisch',
}

export const SPLASH_STYLE_LABELS: Record<string, string> = {
  none: 'Keine Animation',
  reveal: 'Premium-Enthüllung',
  golf: 'Golf-Splash (IKON)',
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  published: 'Veröffentlicht',
  cancelled: 'Abgesagt',
  completed: 'Abgeschlossen',
}

export const RESERVATION_TYPE_LABELS: Record<string, string> = {
  facility: 'Einrichtung',
  restaurant: 'Restaurant',
  space: 'Raum',
  event: 'Veranstaltung',
}

export const BILLING_LIMIT_LABELS: Record<string, (value: number | boolean) => string> = {
  members: (v) => `Bis zu ${v} Mitglieder`,
  eventsPerMonth: (v) => `${v} Veranstaltungen pro Monat`,
  facilities: (v) => `${v} Räume`,
  customDomain: (v) => (v ? 'Eigene Domain' : 'Keine eigene Domain'),
  tournaments: (v) => (v ? 'Turniere inklusive' : 'Keine Turniere'),
  analytics: (v) => (v ? 'Erweiterte Analysen' : 'Keine Analysen'),
}

export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  trial: 'Testphase',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  cancelled: 'Storniert',
  completed: 'Abgeschlossen',
  no_show: 'Nicht erschienen',
}

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  suspended: 'Gesperrt',
  pending: 'Ausstehend',
  invited: 'Eingeladen',
}

export function labelEventType(type: string) {
  return EVENT_TYPE_LABELS[type] || type
}

export function labelTier(tier: string) {
  return SUBSCRIPTION_TIER_LABELS[tier] || tier
}

export function labelMemberStatus(status: string) {
  return MEMBER_STATUS_LABELS[status] || status
}

export function labelReservationStatus(status: string) {
  return RESERVATION_STATUS_LABELS[status] || status
}

export function labelRole(roleName?: string | null, displayName?: string | null) {
  if (roleName && ROLE_LABELS[roleName]) return ROLE_LABELS[roleName]
  if (displayName) return displayName
  return roleName || '—'
}

export function labelPlatformRole(role?: string | null) {
  if (!role) return 'Administrator'
  return PLATFORM_ROLE_LABELS[role] || role
}

export function labelSportName(name?: string | null, displayName?: string | null) {
  if (name) {
    const key = name.toLowerCase().replace(/\s+/g, '_')
    if (SPORT_NAME_LABELS[key]) return SPORT_NAME_LABELS[key]
  }
  if (displayName) {
    const key = displayName.toLowerCase().replace(/\s+/g, '_').replace(/&/g, 'and')
    if (SPORT_NAME_LABELS[key]) return SPORT_NAME_LABELS[key]
    return displayName
  }
  return name || 'Allgemein'
}

export function labelActivityType(type?: string | null) {
  if (!type) return 'Aktivität'
  return ACTIVITY_TYPE_LABELS[type] || type.replace(/_/g, ' ')
}

export function labelEventStatus(status: string) {
  return EVENT_STATUS_LABELS[status] || status
}

export function labelHeroStyle(style: string) {
  return HERO_STYLE_LABELS[style] || style
}

export function labelSplashStyle(style: string) {
  return SPLASH_STYLE_LABELS[style] || style
}

export function labelReservationType(type: string) {
  return RESERVATION_TYPE_LABELS[type] || type
}

export function formatBillingLimit(key: string, value: number | boolean): string {
  const formatter = BILLING_LIMIT_LABELS[key]
  return formatter ? formatter(value) : `${value} ${key}`
}

export function formatPlanLimits(limits: Record<string, number | boolean>): string[] {
  return Object.entries(limits).map(([key, value]) => formatBillingLimit(key, value))
}

export function translateAuthError(message?: string | null): string {
  if (!message) return 'Anmeldung nicht möglich'
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Falsche E-Mail oder Passwort'
  if (lower.includes('email not confirmed')) return 'Bestätigen Sie Ihre E-Mail vor der Anmeldung'
  if (lower.includes('user already registered')) return 'Ein Konto mit dieser E-Mail existiert bereits'
  if (lower.includes('password should be at least')) return 'Passwort ist zu kurz'
  if (lower.includes('signup is disabled')) return 'Registrierung ist nicht verfügbar'
  return message
}

export function translateEmailProviderError(message?: string | null): string | undefined {
  if (!message) return undefined
  const lower = message.toLowerCase()
  if (lower.includes('only send testing emails')) {
    return 'Im Testmodus können Sie nur an Ihre eigene E-Mail senden. Verifizieren Sie eine Domain in Resend, um an beliebige Empfänger zu senden.'
  }
  if (lower.includes('domain is not verified')) {
    return 'Die Absender-Domain ist in Resend nicht verifiziert.'
  }
  return message
}
