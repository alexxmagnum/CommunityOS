'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'
import { DEMO_TOURNAMENTS } from '@/lib/tournaments/demo-tournament'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trophy, Plus, Loader2, ExternalLink, Swords, Users } from 'lucide-react'
import { TOURNAMENT_FORMAT_LABELS, TOURNAMENT_STATUS_LABELS } from '@/lib/tournaments/types'
import { tenantDashboardPath } from '@/lib/org/tenant-path'
import { toast } from 'sonner'

interface TournamentRow {
  id: string
  format: string
  status: string
  event_id: string
  event_title: string
  participant_count: number
}

export default function AdminTournamentsPage() {
  const { activeOrganization } = useAuth()
  const [rows, setRows] = useState<TournamentRow[]>([])
  const [events, setEvents] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [form, setForm] = useState({ event_id: '', format: 'single_elimination', max_teams: '8' })

  const supabase = getSupabaseClient()
  const demoMode = !isSupabaseConfigured()

  async function load() {
    if (!activeOrganization) return
    if (demoMode) {
      setRows(DEMO_TOURNAMENTS.map((t) => ({
        id: t.id,
        format: t.format,
        status: t.status,
        event_id: t.event_id,
        event_title: t.name,
        participant_count: 0,
      })))
      setLoading(false)
      return
    }

    const orgId = activeOrganization.organization_id
    const { data } = await supabase
      .from('tournaments')
      .select('id, format, status, event_id, event:events(title), tournament_participants(count)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    setRows((data || []).map((t) => {
      const event = Array.isArray(t.event) ? t.event[0] : t.event
      const countRow = Array.isArray(t.tournament_participants)
        ? t.tournament_participants[0]
        : t.tournament_participants
      const participantCount =
        countRow && typeof countRow === 'object' && 'count' in countRow
          ? Number(countRow.count) || 0
          : 0
      return {
        id: t.id,
        format: t.format,
        status: t.status,
        event_id: t.event_id,
        event_title: event?.title ?? 'Evento',
        participant_count: participantCount,
      }
    }))

    const { data: evs } = await supabase
      .from('events')
      .select('id, title')
      .eq('organization_id', orgId)
      .eq('type', 'tournament')
      .order('starts_at', { ascending: false })

    setEvents(evs || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeOrganization])

  async function handleCreate() {
    if (!activeOrganization || !form.event_id) return
    if (demoMode) {
      toast.info('Conecta Supabase para crear torneos reales')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('tournaments').insert({
      organization_id: activeOrganization.organization_id,
      event_id: form.event_id,
      format: form.format,
      max_teams: parseInt(form.max_teams, 10),
      status: 'registration',
    })

    if (error) toast.error(error.message)
    else {
      toast.success('Torneo creado')
      setOpen(false)
      load()
    }
    setSaving(false)
  }

  async function generateBracket(tournamentId: string, replace = false) {
    if (demoMode) {
      toast.info('Conecta Supabase para generar cuadros reales')
      return
    }

    setGeneratingId(tournamentId)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/generate-bracket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replace }),
      })
      const payload = (await response.json()) as {
        error?: string
        code?: string
        matchCount?: number
      }

      if (!response.ok) {
        if (payload.code === 'matches_exist' && window.confirm('Este torneo ya tiene partidos. ¿Quieres regenerar el cuadro?')) {
          await generateBracket(tournamentId, true)
          return
        }
        toast.error(payload.error || 'No se pudo generar el cuadro')
        return
      }

      toast.success(`Cuadro generado: ${payload.matchCount ?? 0} partidos`)
      load()
    } catch {
      toast.error('Error de red al generar el cuadro')
    } finally {
      setGeneratingId(null)
    }
  }

  async function updateStatus(id: string, status: string) {
    if (demoMode) return
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Estado actualizado'); load() }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Trophy className="h-6 w-6 text-amber-600" />
            Torneos
          </h1>
          <p className="mt-1 text-muted-foreground">Gestiona cuadros y competiciones</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo torneo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear torneo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Evento vinculado</Label>
                <Select value={form.event_id} onValueChange={(v) => setForm((f) => ({ ...f, event_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar evento" /></SelectTrigger>
                  <SelectContent>
                    {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select value={form.format} onValueChange={(v) => setForm((f) => ({ ...f, format: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_elimination">Eliminación directa</SelectItem>
                    <SelectItem value="round_robin">Todos contra todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Máx. equipos</Label>
                <Input type="number" min={2} max={64} value={form.max_teams} onChange={(e) => setForm((f) => ({ ...f, format: f.format, event_id: f.event_id, max_teams: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={saving || !form.event_id}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {demoMode && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Modo demo — torneo de pádel de ejemplo visible en la app miembro.
        </p>
      )}

      <div className="space-y-3">
        {rows.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{t.event_title}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="outline">{TOURNAMENT_FORMAT_LABELS[t.format as keyof typeof TOURNAMENT_FORMAT_LABELS] || t.format}</Badge>
                  <Badge>{TOURNAMENT_STATUS_LABELS[t.status as keyof typeof TOURNAMENT_STATUS_LABELS] || t.status}</Badge>
                  <Badge variant="secondary">{t.participant_count} equipos</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeOrganization?.organization?.slug && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={tenantDashboardPath(activeOrganization.organization.slug, `tournaments/${t.id}`)}>
                      <Users className="mr-2 h-4 w-4" />
                      Equipos
                    </Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={generatingId === t.id}
                  onClick={() => void generateBracket(t.id)}
                >
                  {generatingId === t.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Swords className="mr-2 h-4 w-4" />
                  )}
                  Generar cuadro
                </Button>
                <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TOURNAMENT_STATUS_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link href={`/o/${activeOrganization?.organization?.slug}/tournaments/${t.id}`} target="_blank">
                  <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4" /></Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay torneos. Crea uno vinculado a un evento de tipo torneo.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
