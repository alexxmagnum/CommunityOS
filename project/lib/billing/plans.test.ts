import { describe, expect, it } from 'vitest'
import { canUseFeature, getPlanByTier, isWithinLimit } from '@/lib/billing/plans'

describe('billing plans', () => {
  it('trial no incluye dominio custom', () => {
    expect(canUseFeature('trial', 'customDomain')).toBe(false)
    expect(canUseFeature('professional', 'customDomain')).toBe(true)
  })

  it('respeta límites de miembros', () => {
    const plan = getPlanByTier('starter')
    expect(isWithinLimit(plan.limits.members - 1, 'starter', 'members')).toBe(true)
    expect(isWithinLimit(plan.limits.members, 'starter', 'members')).toBe(false)
  })
})
