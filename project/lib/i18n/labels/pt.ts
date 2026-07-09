/** Catálogo de etiquetas de sistema — Português */

export const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Evento',
  experience: 'Experiência',
  tournament: 'Torneio',
  workshop: 'Workshop',
  social: 'Encontro social',
  competition: 'Competição',
}

export const ROLE_LABELS: Record<string, string> = {
  org_owner: 'Proprietário do clube',
  org_admin: 'Administrador do clube',
  org_member: 'Membro',
}

export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  support: 'Suporte',
  viewer: 'Só leitura',
}

export const SPORT_NAME_LABELS: Record<string, string> = {
  golf: 'Golf',
  padel: 'Padel',
  paddle: 'Paddle surf',
  tennis: 'Ténis',
  football: 'Futebol',
  basketball: 'Basquetebol',
  swimming: 'Natação',
  billiards: 'Bilhar',
  pickleball: 'Pickleball',
  pitch_and_putt: 'Pitch & Putt',
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  reservation: 'Reserva',
  event_join: 'Inscrição em evento',
  tournament_win: 'Vitória em torneio',
  tournament_join: 'Inscrição em torneio',
  member_join: 'Novo membro',
  achievement: 'Conquista',
}

export const HERO_STYLE_LABELS: Record<string, string> = {
  standard: 'Padrão',
  cinematic: 'Cinemático',
}

export const SPLASH_STYLE_LABELS: Record<string, string> = {
  none: 'Sem animação',
  reveal: 'Abertura premium',
  golf: 'Splash golfe (IKON)',
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
}

export const RESERVATION_TYPE_LABELS: Record<string, string> = {
  facility: 'Instalação',
  restaurant: 'Restaurante',
  space: 'Espaço',
  event: 'Evento',
}

export const BILLING_LIMIT_LABELS: Record<string, (value: number | boolean) => string> = {
  members: (v) => `Até ${v} membros`,
  eventsPerMonth: (v) => `${v} eventos por mês`,
  facilities: (v) => `${v} espaços`,
  customDomain: (v) => (v ? 'Domínio personalizado' : 'Sem domínio personalizado'),
  tournaments: (v) => (v ? 'Torneios incluídos' : 'Sem torneios'),
  analytics: (v) => (v ? 'Análise avançada' : 'Sem análise'),
}

export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  trial: 'Teste',
  starter: 'Inicial',
  professional: 'Profissional',
  enterprise: 'Empresa',
}

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Concluída',
  no_show: 'Não compareceu',
}

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
  pending: 'Pendente',
  invited: 'Convidado',
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
  return name || 'Geral'
}

export function labelActivityType(type?: string | null) {
  if (!type) return 'Atividade'
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
  if (!message) return 'Não foi possível iniciar sessão'
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Email ou palavra-passe incorretos'
  if (lower.includes('email not confirmed')) return 'Confirme o seu email antes de entrar'
  if (lower.includes('user already registered')) return 'Já existe uma conta com este email'
  if (lower.includes('password should be at least')) return 'A palavra-passe é demasiado curta'
  if (lower.includes('signup is disabled')) return 'O registo não está disponível'
  return message
}

export function translateEmailProviderError(message?: string | null): string | undefined {
  if (!message) return undefined
  const lower = message.toLowerCase()
  if (lower.includes('only send testing emails')) {
    return 'Em modo de teste só pode enviar para o seu próprio email. Verifique um domínio no Resend.'
  }
  if (lower.includes('domain is not verified')) {
    return 'O domínio do remetente não está verificado no Resend.'
  }
  return message
}
