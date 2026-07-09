/** Catálogo de etiquetas de sistema — Italiano */

export const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Evento',
  experience: 'Esperienza',
  tournament: 'Torneo',
  workshop: 'Workshop',
  social: 'Incontro sociale',
  competition: 'Competizione',
}

export const ROLE_LABELS: Record<string, string> = {
  org_owner: 'Proprietario del club',
  org_admin: 'Amministratore del club',
  org_member: 'Membro',
}

export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietario',
  admin: 'Amministratore',
  support: 'Supporto',
  viewer: 'Sola lettura',
}

export const SPORT_NAME_LABELS: Record<string, string> = {
  golf: 'Golf',
  padel: 'Padel',
  paddle: 'Paddle surf',
  tennis: 'Tennis',
  football: 'Calcio',
  basketball: 'Pallacanestro',
  swimming: 'Nuoto',
  billiards: 'Biliardo',
  pickleball: 'Pickleball',
  pitch_and_putt: 'Pitch & Putt',
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  reservation: 'Prenotazione',
  event_join: 'Iscrizione all\'evento',
  tournament_win: 'Vittoria in torneo',
  tournament_join: 'Iscrizione al torneo',
  member_join: 'Nuovo membro',
  achievement: 'Traguardo',
}

export const HERO_STYLE_LABELS: Record<string, string> = {
  standard: 'Standard',
  cinematic: 'Cinematografico',
}

export const SPLASH_STYLE_LABELS: Record<string, string> = {
  none: 'Nessuna animazione',
  reveal: 'Apertura premium',
  golf: 'Splash golf (IKON)',
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Bozza',
  published: 'Pubblicato',
  cancelled: 'Annullato',
  completed: 'Completato',
}

export const RESERVATION_TYPE_LABELS: Record<string, string> = {
  facility: 'Struttura',
  restaurant: 'Ristorante',
  space: 'Spazio',
  event: 'Evento',
}

export const BILLING_LIMIT_LABELS: Record<string, (value: number | boolean) => string> = {
  members: (v) => `Fino a ${v} membri`,
  eventsPerMonth: (v) => `${v} eventi al mese`,
  facilities: (v) => `${v} spazi`,
  customDomain: (v) => (v ? 'Dominio personalizzato' : 'Nessun dominio personalizzato'),
  tournaments: (v) => (v ? 'Tornei inclusi' : 'Nessun torneo'),
  analytics: (v) => (v ? 'Analisi avanzate' : 'Nessuna analisi'),
}

export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  trial: 'Prova',
  starter: 'Starter',
  professional: 'Professionale',
  enterprise: 'Enterprise',
}

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'In attesa',
  confirmed: 'Confermata',
  cancelled: 'Annullata',
  completed: 'Completata',
  no_show: 'Non presentato',
}

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Attivo',
  suspended: 'Sospeso',
  pending: 'In attesa',
  invited: 'Invitato',
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
  if (!role) return 'Amministratore'
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
  return name || 'Generale'
}

export function labelActivityType(type?: string | null) {
  if (!type) return 'Attività'
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
  if (!message) return 'Impossibile accedere'
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Email o password non corretti'
  if (lower.includes('email not confirmed')) return 'Conferma la tua email prima di accedere'
  if (lower.includes('user already registered')) return 'Esiste già un account con questa email'
  if (lower.includes('password should be at least')) return 'La password è troppo corta'
  if (lower.includes('signup is disabled')) return 'La registrazione non è disponibile'
  return message
}

export function translateEmailProviderError(message?: string | null): string | undefined {
  if (!message) return undefined
  const lower = message.toLowerCase()
  if (lower.includes('only send testing emails')) {
    return 'In modalità test puoi inviare solo alla tua email. Verifica un dominio in Resend per inviare a qualsiasi destinatario.'
  }
  if (lower.includes('domain is not verified')) {
    return 'Il dominio del mittente non è verificato in Resend.'
  }
  return message
}
