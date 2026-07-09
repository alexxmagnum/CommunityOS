export type OrgModuleKey = 'restaurant' | 'sports' | 'events' | 'tournaments'

export type OrgModules = Partial<Record<OrgModuleKey, boolean>>

export const ORG_MODULE_KEYS: OrgModuleKey[] = ['restaurant', 'sports', 'events', 'tournaments']

export const DEFAULT_ORG_MODULES: Record<OrgModuleKey, boolean> = {
  restaurant: true,
  sports: true,
  events: true,
  tournaments: true,
}

export function parseOrgModules(raw: unknown): OrgModules | null {
  if (raw == null) return null
  let value: unknown = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (typeof value !== 'object' || Array.isArray(value)) return null
  return value as OrgModules
}

/** Solo muestra módulos con `true` explícito en la base de datos. */
export function isModuleEnabled(modules: OrgModules | undefined | null, key: OrgModuleKey): boolean {
  const parsed = modules ?? null
  if (!parsed || Object.keys(parsed).length === 0) {
    return DEFAULT_ORG_MODULES[key]
  }
  return parsed[key] === true
}

export function modulesForDatabase(modules?: OrgModules | null): Record<OrgModuleKey, boolean> {
  return {
    restaurant: modules?.restaurant === true,
    sports: modules?.sports === true,
    events: modules?.events === true,
    tournaments: modules?.tournaments === true,
  }
}

export interface TenantNavItem {
  segment: string
  label: string
  module: OrgModuleKey
}

export const TENANT_NAV: TenantNavItem[] = [
  { segment: '/reservations?sport=golf', label: 'Golf', module: 'sports' },
  { segment: '/carta', label: 'Carta', module: 'restaurant' },
  { segment: '/events', label: 'Eventos', module: 'events' },
  { segment: '/tournaments', label: 'Torneos', module: 'tournaments' },
  { segment: '/reservations', label: 'Reservar', module: 'sports' },
]

export function getTenantNavItems(modules?: OrgModules | null): TenantNavItem[] {
  return TENANT_NAV.filter((item) => isModuleEnabled(modules, item.module))
}
