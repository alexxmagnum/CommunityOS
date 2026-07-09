/** Catálogo de etiquetas de sistema — English */

export const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Event',
  experience: 'Experience',
  tournament: 'Tournament',
  workshop: 'Workshop',
  social: 'Social gathering',
  competition: 'Competition',
}

export const ROLE_LABELS: Record<string, string> = {
  org_owner: 'Club owner',
  org_admin: 'Club administrator',
  org_member: 'Member',
}

export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  support: 'Support',
  viewer: 'View only',
}

export const SPORT_NAME_LABELS: Record<string, string> = {
  golf: 'Golf',
  padel: 'Padel',
  paddle: 'Paddle boarding',
  tennis: 'Tennis',
  football: 'Football',
  basketball: 'Basketball',
  swimming: 'Swimming',
  billiards: 'Billiards',
  pickleball: 'Pickleball',
  pitch_and_putt: 'Pitch & Putt',
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  reservation: 'Booking',
  event_join: 'Event registration',
  tournament_win: 'Tournament win',
  tournament_join: 'Tournament registration',
  member_join: 'New member',
  achievement: 'Achievement',
}

export const HERO_STYLE_LABELS: Record<string, string> = {
  standard: 'Standard',
  cinematic: 'Cinematic',
}

export const SPLASH_STYLE_LABELS: Record<string, string> = {
  none: 'No animation',
  reveal: 'Premium reveal',
  golf: 'Golf splash (IKON)',
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export const RESERVATION_TYPE_LABELS: Record<string, string> = {
  facility: 'Facility',
  restaurant: 'Restaurant',
  space: 'Space',
  event: 'Event',
}

export const BILLING_LIMIT_LABELS: Record<string, (value: number | boolean) => string> = {
  members: (v) => `Up to ${v} members`,
  eventsPerMonth: (v) => `${v} events per month`,
  facilities: (v) => `${v} spaces`,
  customDomain: (v) => (v ? 'Custom domain' : 'No custom domain'),
  tournaments: (v) => (v ? 'Tournaments included' : 'No tournaments'),
  analytics: (v) => (v ? 'Advanced analytics' : 'No analytics'),
}

export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  trial: 'Trial',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No show',
}

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  pending: 'Pending',
  invited: 'Invited',
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
  return name || 'General'
}

export function labelActivityType(type?: string | null) {
  if (!type) return 'Activity'
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
  if (!message) return 'Could not sign in'
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Incorrect email or password'
  if (lower.includes('email not confirmed')) return 'Confirm your email before signing in'
  if (lower.includes('user already registered')) return 'An account with this email already exists'
  if (lower.includes('password should be at least')) return 'Password is too short'
  if (lower.includes('signup is disabled')) return 'Sign-up is not available'
  return message
}

export function translateEmailProviderError(message?: string | null): string | undefined {
  if (!message) return undefined
  const lower = message.toLowerCase()
  if (lower.includes('only send testing emails')) {
    return 'In test mode you can only send to your own email. Verify a domain in Resend to send to any recipient.'
  }
  if (lower.includes('domain is not verified')) {
    return 'The sender domain is not verified in Resend.'
  }
  return message
}
