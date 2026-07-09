/** Catálogo de etiquetas de sistema — español */

export const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Evento',
  experience: 'Experiencia',
  tournament: 'Torneo',
  workshop: 'Taller',
  social: 'Encuentro social',
  competition: 'Competición',
}

export const ROLE_LABELS: Record<string, string> = {
  org_owner: 'Propietario del club',
  org_admin: 'Administrador del club',
  org_member: 'Miembro',
}

export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  support: 'Soporte',
  viewer: 'Solo lectura',
}

export const SPORT_NAME_LABELS: Record<string, string> = {
  golf: 'Golf',
  padel: 'Pádel',
  paddle: 'Paddle surf',
  tennis: 'Tenis',
  football: 'Fútbol',
  basketball: 'Baloncesto',
  swimming: 'Natación',
  billiards: 'Billar',
  pickleball: 'Pickleball',
  pitch_and_putt: 'Pitch & Putt',
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  reservation: 'Reserva',
  event_join: 'Inscripción a evento',
  tournament_win: 'Victoria en torneo',
  tournament_join: 'Inscripción a torneo',
  member_join: 'Nuevo miembro',
  achievement: 'Logro',
}

export const HERO_STYLE_LABELS: Record<string, string> = {
  standard: 'Estándar',
  cinematic: 'Cinemático',
}

export const SPLASH_STYLE_LABELS: Record<string, string> = {
  none: 'Sin animación',
  reveal: 'Apertura premium',
  golf: 'Splash golf (IKON)',
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  cancelled: 'Cancelado',
  completed: 'Completado',
}

export const RESERVATION_TYPE_LABELS: Record<string, string> = {
  facility: 'Instalación',
  restaurant: 'Restaurante',
  space: 'Espacio',
  event: 'Evento',
}

export const BILLING_LIMIT_LABELS: Record<string, (value: number | boolean) => string> = {
  members: (v) => `Hasta ${v} miembros`,
  eventsPerMonth: (v) => `${v} eventos al mes`,
  facilities: (v) => `${v} espacios`,
  customDomain: (v) => (v ? 'Dominio personalizado' : 'Sin dominio personalizado'),
  tournaments: (v) => (v ? 'Torneos incluidos' : 'Sin torneos'),
  analytics: (v) => (v ? 'Analítica avanzada' : 'Sin analítica'),
}

export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  trial: 'Prueba',
  starter: 'Inicial',
  professional: 'Profesional',
  enterprise: 'Empresa',
}

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No presentado',
}

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  pending: 'Pendiente',
  invited: 'Invitado',
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
  if (!role) return 'Administrador'
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
  return name || 'General'
}

export function labelActivityType(type?: string | null) {
  if (!type) return 'Actividad'
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
  if (!message) return 'No se pudo iniciar sesión'
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Correo o contraseña incorrectos'
  if (lower.includes('email not confirmed')) return 'Confirma tu correo antes de entrar'
  if (lower.includes('user already registered')) return 'Ya existe una cuenta con este correo'
  if (lower.includes('password should be at least')) return 'La contraseña es demasiado corta'
  if (lower.includes('signup is disabled')) return 'El registro no está disponible'
  return message
}

export function translateEmailProviderError(message?: string | null): string | undefined {
  if (!message) return undefined
  const lower = message.toLowerCase()
  if (lower.includes('only send testing emails')) {
    return 'En modo prueba solo puedes enviar a tu propio correo. Verifica un dominio en Resend para enviar a cualquier destinatario.'
  }
  if (lower.includes('domain is not verified')) {
    return 'El dominio del remitente no está verificado en Resend.'
  }
  return message
}
