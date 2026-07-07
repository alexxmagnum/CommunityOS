'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { BILLING_PLANS, getPlanByTier, type SubscriptionTier } from '@/lib/billing/plans'
import { formatMoney } from '@/lib/i18n/format-currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ExternalLink, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function BillingPage() {
  const { activeOrganization } = useAuth()
  const tier = (activeOrganization?.organization as { subscription_tier?: string } | undefined)
    ?.subscription_tier as SubscriptionTier | undefined ?? 'trial'
  const current = getPlanByTier(tier)
  const [portalLoading, setPortalLoading] = useState(false)

  async function openStripePortal() {
    setPortalLoading(true)
    try {
      // Placeholder hasta conectar Stripe Checkout / Customer Portal
      toast.info('Stripe Customer Portal — configurar STRIPE_SECRET_KEY y webhook')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <CreditCard className="h-6 w-6 text-emerald-600" />
          Facturación
        </h1>
        <p className="mt-1 text-slate-500">Plan actual y límites de tu organización</p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan {current.name}</CardTitle>
              <CardDescription>{current.description}</CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize">
              {tier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-semibold">
            {formatMoney(current.priceMonthly)}
            <span className="text-base font-normal text-muted-foreground">/mes</span>
          </p>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li>Hasta {current.limits.members} miembros</li>
            <li>{current.limits.eventsPerMonth} eventos/mes</li>
            <li>{current.limits.facilities} espacios</li>
            <li>{current.limits.customDomain ? 'Dominio custom' : 'Sin dominio custom'}</li>
          </ul>
          <Button onClick={openStripePortal} disabled={portalLoading} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Portal de facturación (Stripe)
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {BILLING_PLANS.filter((p) => p.tier !== 'trial').map((plan) => (
          <Card key={plan.tier} className={plan.tier === tier ? 'ring-2 ring-emerald-500' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{formatMoney(plan.priceMonthly)}/mes</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {Object.entries(plan.limits)
                  .filter(([, v]) => v === true || typeof v === 'number')
                  .slice(0, 4)
                  .map(([key, val]) => (
                    <li key={key} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      {typeof val === 'boolean' ? key : `${val} ${key}`}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
