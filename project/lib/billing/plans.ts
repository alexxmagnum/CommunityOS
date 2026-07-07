export type SubscriptionTier = 'trial' | 'starter' | 'professional' | 'enterprise'

export interface BillingPlan {
  tier: SubscriptionTier
  name: string
  priceMonthly: number
  currency: string
  description: string
  limits: {
    members: number
    eventsPerMonth: number
    facilities: number
    customDomain: boolean
    tournaments: boolean
    analytics: boolean
  }
  stripePriceId?: string
}

export const BILLING_PLANS: BillingPlan[] = [
  {
    tier: 'trial',
    name: 'Prueba',
    priceMonthly: 0,
    currency: 'EUR',
    description: '14 días para explorar la plataforma',
    limits: {
      members: 50,
      eventsPerMonth: 5,
      facilities: 3,
      customDomain: false,
      tournaments: false,
      analytics: false,
    },
  },
  {
    tier: 'starter',
    name: 'Starter',
    priceMonthly: 79,
    currency: 'EUR',
    description: 'Clubs pequeños y asociaciones',
    limits: {
      members: 200,
      eventsPerMonth: 20,
      facilities: 10,
      customDomain: false,
      tournaments: true,
      analytics: false,
    },
    stripePriceId: 'price_starter_placeholder',
  },
  {
    tier: 'professional',
    name: 'Professional',
    priceMonthly: 199,
    currency: 'EUR',
    description: 'Operación completa con white-label',
    limits: {
      members: 1000,
      eventsPerMonth: 100,
      facilities: 50,
      customDomain: true,
      tournaments: true,
      analytics: true,
    },
    stripePriceId: 'price_pro_placeholder',
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 499,
    currency: 'EUR',
    description: 'Multi-sede y soporte dedicado',
    limits: {
      members: 10000,
      eventsPerMonth: 1000,
      facilities: 500,
      customDomain: true,
      tournaments: true,
      analytics: true,
    },
    stripePriceId: 'price_enterprise_placeholder',
  },
]

export function getPlanByTier(tier: SubscriptionTier): BillingPlan {
  return BILLING_PLANS.find((p) => p.tier === tier) ?? BILLING_PLANS[0]
}

export function canUseFeature(
  tier: SubscriptionTier,
  feature: keyof BillingPlan['limits']
): boolean {
  const plan = getPlanByTier(tier)
  const value = plan.limits[feature]
  return typeof value === 'boolean' ? value : value > 0
}

export function isWithinLimit(current: number, tier: SubscriptionTier, limitKey: 'members' | 'eventsPerMonth' | 'facilities'): boolean {
  const plan = getPlanByTier(tier)
  return current < plan.limits[limitKey]
}
