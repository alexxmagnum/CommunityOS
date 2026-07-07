'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { tenantPath } from '@/lib/org/tenant-path'
import { labelTier } from '@/lib/i18n/es'

const TIERS = ['trial', 'starter', 'professional', 'enterprise'] as const

interface OrgRow {
  id: string
  name: string
  slug: string
  subscription_tier: string
  is_active: boolean
  subscription_ends_at: string | null
}

export default function SubscriptionsPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const supabase = getSupabaseClient()

  async function load() {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, subscription_tier, is_active, subscription_ends_at')
      .order('name')
    if (error) toast.error(error.message)
    else {
      setOrgs(data || [])
      const c: Record<string, number> = {}
      TIERS.forEach((t) => { c[t] = 0 })
      ;(data || []).forEach((o) => { c[o.subscription_tier] = (c[o.subscription_tier] || 0) + 1 })
      setCounts(c)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateTier(orgId: string, tier: string) {
    const { error } = await supabase.from('organizations').update({ subscription_tier: tier }).eq('id', orgId)
    if (error) toast.error(error.message)
    else { toast.success('Plan actualizado'); load() }
  }

  const total = orgs.length || 1

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6" /> Suscripciones
        </h1>
        <p className="text-slate-500 mt-1">Planes y módulos por organización</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {TIERS.map((tier) => (
          <Card key={tier}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">{labelTier(tier)}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{counts[tier] || 0}</p>
              <Progress value={((counts[tier] || 0) / total) * 100} className="mt-3 h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Organizaciones</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {orgs.length === 0 ? (
            <p className="text-slate-500 py-8 text-center">Sin organizaciones</p>
          ) : orgs.map((org) => (
            <div key={org.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <Link href={tenantPath(org.slug)} className="font-medium hover:underline">{org.name}</Link>
                <p className="text-xs text-slate-500">{org.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={org.is_active ? 'default' : 'secondary'}>{org.is_active ? 'Activo' : 'Inactivo'}</Badge>
                <Select value={org.subscription_tier} onValueChange={(v) => updateTier(org.id, v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIERS.map((t) => <SelectItem key={t} value={t}>{labelTier(t)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
