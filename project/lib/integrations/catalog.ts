export type IntegrationProvider = 'google_calendar' | 'mailchimp' | 'restaurant_pos'

export interface IntegrationConfig {
  provider: IntegrationProvider
  label: string
  description: string
  connected: boolean
  lastSyncAt?: string | null
}

export const INTEGRATION_CATALOG: Omit<IntegrationConfig, 'connected' | 'lastSyncAt'>[] = [
  {
    provider: 'google_calendar',
    label: 'Google Calendar',
    description: 'Sincroniza eventos del club con calendarios de socios y staff.',
  },
  {
    provider: 'mailchimp',
    label: 'Mailchimp',
    description: 'Exporta segmentos de miembros para campañas de email.',
  },
  {
    provider: 'restaurant_pos',
    label: 'POS Restaurante',
    description: 'Conecta con TPV para cerrar pedidos de mesa y pre-pedidos.',
  },
]

export function getDemoIntegrations(): IntegrationConfig[] {
  return INTEGRATION_CATALOG.map((item, i) => ({
    ...item,
    connected: i === 0,
    lastSyncAt: i === 0 ? new Date(Date.now() - 3600000).toISOString() : null,
  }))
}
