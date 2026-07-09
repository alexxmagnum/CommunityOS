/** Catálogo de etiquetas de sistema — Français */

export const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Événement',
  experience: 'Expérience',
  tournament: 'Tournoi',
  workshop: 'Atelier',
  social: 'Rencontre sociale',
  competition: 'Compétition',
}

export const ROLE_LABELS: Record<string, string> = {
  org_owner: 'Propriétaire du club',
  org_admin: 'Administrateur du club',
  org_member: 'Membre',
}

export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  support: 'Support',
  viewer: 'Lecture seule',
}

export const SPORT_NAME_LABELS: Record<string, string> = {
  golf: 'Golf',
  padel: 'Padel',
  paddle: 'Stand-up paddle',
  tennis: 'Tennis',
  football: 'Football',
  basketball: 'Basketball',
  swimming: 'Natation',
  billiards: 'Billard',
  pickleball: 'Pickleball',
  pitch_and_putt: 'Pitch & Putt',
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  reservation: 'Réservation',
  event_join: 'Inscription à un événement',
  tournament_win: 'Victoire en tournoi',
  tournament_join: 'Inscription au tournoi',
  member_join: 'Nouveau membre',
  achievement: 'Réussite',
}

export const HERO_STYLE_LABELS: Record<string, string> = {
  standard: 'Standard',
  cinematic: 'Cinématique',
}

export const SPLASH_STYLE_LABELS: Record<string, string> = {
  none: 'Sans animation',
  reveal: 'Ouverture premium',
  golf: 'Splash golf (IKON)',
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  cancelled: 'Annulé',
  completed: 'Terminé',
}

export const RESERVATION_TYPE_LABELS: Record<string, string> = {
  facility: 'Installation',
  restaurant: 'Restaurant',
  space: 'Espace',
  event: 'Événement',
}

export const BILLING_LIMIT_LABELS: Record<string, (value: number | boolean) => string> = {
  members: (v) => `Jusqu'à ${v} membres`,
  eventsPerMonth: (v) => `${v} événements par mois`,
  facilities: (v) => `${v} espaces`,
  customDomain: (v) => (v ? 'Domaine personnalisé' : 'Pas de domaine personnalisé'),
  tournaments: (v) => (v ? 'Tournois inclus' : 'Pas de tournois'),
  analytics: (v) => (v ? 'Analytique avancée' : 'Pas d\'analytique'),
}

export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  trial: 'Essai',
  starter: 'Starter',
  professional: 'Professionnel',
  enterprise: 'Entreprise',
}

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  completed: 'Terminée',
  no_show: 'Absent',
}

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  pending: 'En attente',
  invited: 'Invité',
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
  if (!role) return 'Administrateur'
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
  return name || 'Général'
}

export function labelActivityType(type?: string | null) {
  if (!type) return 'Activité'
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
  if (!message) return 'Impossible de se connecter'
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect'
  if (lower.includes('email not confirmed')) return 'Confirmez votre e-mail avant de vous connecter'
  if (lower.includes('user already registered')) return 'Un compte avec cet e-mail existe déjà'
  if (lower.includes('password should be at least')) return 'Le mot de passe est trop court'
  if (lower.includes('signup is disabled')) return 'L\'inscription n\'est pas disponible'
  return message
}

export function translateEmailProviderError(message?: string | null): string | undefined {
  if (!message) return undefined
  const lower = message.toLowerCase()
  if (lower.includes('only send testing emails')) {
    return 'En mode test, vous ne pouvez envoyer qu\'à votre propre e-mail. Vérifiez un domaine dans Resend pour envoyer à n\'importe quel destinataire.'
  }
  if (lower.includes('domain is not verified')) {
    return 'Le domaine de l\'expéditeur n\'est pas vérifié dans Resend.'
  }
  return message
}
