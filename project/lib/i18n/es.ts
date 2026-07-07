/** Etiquetas UI en español (único idioma por ahora) */

export const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Evento',
  experience: 'Experiencia',
  tournament: 'Torneo',
  workshop: 'Taller',
  social: 'Social',
  competition: 'Competición',
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

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  cancelled: 'Cancelado',
  completed: 'Completado',
}

export function labelEventType(type: string) {
  return EVENT_TYPE_LABELS[type] || type
}

export function labelTier(tier: string) {
  return SUBSCRIPTION_TIER_LABELS[tier] || tier
}

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  pending: 'Pendiente',
  invited: 'Invitado',
}

export function labelMemberStatus(status: string) {
  return MEMBER_STATUS_LABELS[status] || status
}

export function labelReservationStatus(status: string) {
  return RESERVATION_STATUS_LABELS[status] || status
}
