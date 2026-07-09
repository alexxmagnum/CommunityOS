'use client'

import { useState } from 'react'
import { DEMO_SPORT_RULES, DEFAULT_SPORT_RULES, type SportBookingRules } from '@/lib/sports/rules'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { labelSportName } from '@/lib/i18n/es'
import { toast } from 'sonner'

const SPORT_KEYS = Object.keys(DEMO_SPORT_RULES)

export function SportRulesPanel() {
  const [activeSport, setActiveSport] = useState(SPORT_KEYS[0])
  const [rules, setRules] = useState<Record<string, SportBookingRules>>(DEMO_SPORT_RULES)

  const current = { ...DEFAULT_SPORT_RULES, ...rules[activeSport] }

  function update(field: keyof SportBookingRules, value: number | boolean) {
    setRules((prev) => ({
      ...prev,
      [activeSport]: { ...prev[activeSport], [field]: value },
    }))
  }

  function save() {
    toast.success('Reglas guardadas (modo demo — conecta Supabase para guardar de verdad)')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reglas de reserva por deporte</CardTitle>
        <CardDescription>Duración, cancelación, socios y recargos configurables</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {SPORT_KEYS.map((key) => (
            <Button
              key={key}
              size="sm"
              variant={activeSport === key ? 'default' : 'outline'}
              onClick={() => setActiveSport(key)}
              className="capitalize"
            >
              {labelSportName(key)}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Duración slot (min)</Label>
            <Input
              type="number"
              value={current.slot_minutes ?? 60}
              onChange={(e) => update('slot_minutes', parseInt(e.target.value, 10) || 60)}
            />
          </div>
          <div className="space-y-2">
            <Label>Antelación máx. (días)</Label>
            <Input
              type="number"
              value={current.advance_booking_days ?? 14}
              onChange={(e) => update('advance_booking_days', parseInt(e.target.value, 10) || 14)}
            />
          </div>
          <div className="space-y-2">
            <Label>Cancelación (horas)</Label>
            <Input
              type="number"
              value={current.cancellation_hours ?? 24}
              onChange={(e) => update('cancellation_hours', parseInt(e.target.value, 10) || 24)}
            />
          </div>
          <div className="space-y-2">
            <Label>Recargo hora punta (%)</Label>
            <Input
              type="number"
              value={current.peak_surcharge_percent ?? 0}
              onChange={(e) => update('peak_surcharge_percent', parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Solo socios</p>
              <p className="text-xs text-muted-foreground">Restringe reservas a miembros activos</p>
            </div>
            <Switch
              checked={Boolean(current.members_only)}
              onCheckedChange={(v) => update('members_only', v)}
            />
          </div>
        </div>

        <Button onClick={save}>Guardar reglas</Button>
      </CardContent>
    </Card>
  )
}
