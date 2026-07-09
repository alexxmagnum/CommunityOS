'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'
import { tenantDashboardPath } from '@/lib/org/tenant-path'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Plus,
  Swords,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import {
  MATCH_STATUS_LABELS,
  PARTICIPANT_STATUS_LABELS,
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_LABELS,
  type MatchStatus,
  type ParticipantStatus,
  type TournamentStatus,
} from '@/lib/tournaments/types'
import { toast } from 'sonner'

interface ParticipantRow {
  id: string
  team_name: string | null
  seed: number | null
  status: ParticipantStatus
  captain_id: string | null
  captain_name: string | null
}

interface MatchRow {
  id: string
  round: number
  match_number: number
  status: MatchStatus
  participant1_id: string | null
  participant2_id: string | null
  participant1_name: string | null
  participant2_name: string | null
  winner_id: string | null
  score_summary: string | null
}

interface MemberOption {
  user_id: string
  full_name: string | null
}

export default function TournamentParticipantsPage() {
  const params = useParams<{ id: string }>()
  const tournamentId = params.id
  const { activeOrganization } = useAuth()
  const slug = activeOrganization?.organization?.slug ?? 'ikon'
  const demoMode = !isSupabaseConfigured()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [format, setFormat] = useState('')
  const [status, setStatus] = useState<TournamentStatus>('registration')
  const [maxTeams, setMaxTeams] = useState<number | null>(null)
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [form, setForm] = useState({ team_name: '', seed: '', captain_id: '' })
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [scoreByMatch, setScoreByMatch] = useState<Record<string, string>>({})

  const supabase = getSupabaseClient()
  const canEdit = status === 'registration' || status === 'check_in'

  async function load() {
    if (!activeOrganization || demoMode) {
      setLoading(false)
      return
    }

    const orgId = activeOrganization.organization_id

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('id, format, status, max_teams, event:events(title)')
      .eq('id', tournamentId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (error || !tournament) {
      toast.error('Torneo no encontrado')
      setLoading(false)
      return
    }

    const event = Array.isArray(tournament.event) ? tournament.event[0] : tournament.event
    setEventTitle(event?.title ?? 'Torneo')
    setFormat(tournament.format)
    setStatus(tournament.status as TournamentStatus)
    setMaxTeams(tournament.max_teams)

    const { data: rows } = await supabase
      .from('tournament_participants')
      .select('id, team_name, seed, status, captain_id')
      .eq('tournament_id', tournamentId)
      .eq('organization_id', orgId)
      .order('seed', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    const captainIds = (rows ?? []).map((r) => r.captain_id).filter(Boolean) as string[]
    let profileMap = new Map<string, string | null>()

    if (captainIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', captainIds)

      profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]))
    }

    setParticipants(
      (rows ?? []).map((row) => ({
        ...row,
        status: row.status as ParticipantStatus,
        captain_name: row.captain_id ? profileMap.get(row.captain_id) ?? null : null,
      }))
    )

    const nameById = new Map(
      (rows ?? []).map((row) => [row.id, row.team_name || 'Equipo'])
    )

    const { data: matchRows } = await supabase
      .from('matches')
      .select('id, round, match_number, status, participant1_id, participant2_id, winner_id, score')
      .eq('tournament_id', tournamentId)
      .order('round')
      .order('match_number')

    setMatches(
      (matchRows ?? []).map((m) => {
        const score =
          m.score && typeof m.score === 'object' && 'summary' in (m.score as object)
            ? String((m.score as { summary?: string }).summary ?? '')
            : null
        return {
          id: m.id,
          round: m.round,
          match_number: m.match_number,
          status: m.status as MatchStatus,
          participant1_id: m.participant1_id,
          participant2_id: m.participant2_id,
          participant1_name: m.participant1_id ? nameById.get(m.participant1_id) ?? null : null,
          participant2_name: m.participant2_id ? nameById.get(m.participant2_id) ?? null : null,
          winner_id: m.winner_id,
          score_summary: score,
        }
      })
    )

    const { data: membersData } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    const memberProfiles = await Promise.all(
      (membersData ?? []).map(async (m) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', m.user_id)
          .maybeSingle()
        return { user_id: m.user_id, full_name: profile?.full_name ?? null }
      })
    )

    setMembers(memberProfiles)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [activeOrganization, tournamentId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOrganization || demoMode) return

    const teamName = form.team_name.trim()
    if (!teamName) {
      toast.error('Indica el nombre del equipo')
      return
    }

    if (maxTeams != null && participants.length >= maxTeams) {
      toast.error(`El torneo admite como máximo ${maxTeams} equipos`)
      return
    }

    setSaving(true)
    const orgId = activeOrganization.organization_id
    const nextSeed =
      form.seed.trim() !== ''
        ? parseInt(form.seed, 10)
        : participants.length + 1

    const { error } = await supabase.from('tournament_participants').insert({
      organization_id: orgId,
      tournament_id: tournamentId,
      team_name: teamName,
      seed: Number.isFinite(nextSeed) ? nextSeed : null,
      captain_id: form.captain_id || null,
      status: 'registered',
    })

    if (error) toast.error(error.message)
    else {
      toast.success('Equipo inscrito')
      setForm({ team_name: '', seed: '', captain_id: '' })
      void load()
    }
    setSaving(false)
  }

  async function handleRemove(participant: ParticipantRow) {
    if (!activeOrganization || demoMode || !canEdit) return
    if (!window.confirm(`¿Quitar a "${participant.team_name}" del torneo?`)) return

    const { error } = await supabase
      .from('tournament_participants')
      .delete()
      .eq('id', participant.id)

    if (error) toast.error(error.message)
    else {
      toast.success('Equipo eliminado')
      void load()
    }
  }

  async function generateBracket(replace = false) {
    if (demoMode) {
      toast.info('Conecta Supabase para generar cuadros reales')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/generate-bracket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replace }),
      })
      const payload = (await response.json()) as { error?: string; code?: string; matchCount?: number }

      if (!response.ok) {
        if (payload.code === 'matches_exist' && window.confirm('Ya hay partidos. ¿Regenerar el cuadro?')) {
          await generateBracket(true)
          return
        }
        toast.error(payload.error || 'No se pudo generar el cuadro')
        return
      }

      toast.success(`Cuadro generado: ${payload.matchCount ?? 0} partidos`)
      void load()
    } catch {
      toast.error('Error de red')
    } finally {
      setGenerating(false)
    }
  }

  async function recordResult(match: MatchRow, winnerParticipantId: string) {
    if (!winnerParticipantId) return

    setRecordingId(match.id)
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}/result`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            winnerParticipantId,
            score: scoreByMatch[match.id]?.trim() || undefined,
          }),
        }
      )
      const payload = (await response.json()) as {
        error?: string
        tournamentCompleted?: boolean
      }

      if (!response.ok) {
        toast.error(payload.error || 'No se pudo guardar el resultado')
        return
      }

      if (payload.tournamentCompleted) {
        toast.success('Torneo finalizado')
      } else {
        toast.success('Resultado registrado')
      }
      void load()
    } catch {
      toast.error('Error de red')
    } finally {
      setRecordingId(null)
    }
  }

  const pendingMatches = matches.filter(
    (m) => m.status === 'pending' && m.participant1_id && m.participant2_id
  )
  const closedMatches = matches.filter((m) => m.status === 'completed' || m.status === 'walkover')

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (demoMode) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href={tenantDashboardPath(slug, 'tournaments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a torneos
          </Link>
        </Button>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Conecta Supabase para gestionar equipos en torneos reales.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href={tenantDashboardPath(slug, 'tournaments')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torneos
            </Link>
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Trophy className="h-6 w-6 text-amber-600" />
            {eventTitle}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">
              {TOURNAMENT_FORMAT_LABELS[format as keyof typeof TOURNAMENT_FORMAT_LABELS] || format}
            </Badge>
            <Badge>{TOURNAMENT_STATUS_LABELS[status]}</Badge>
            <Badge variant="secondary">
              <Users className="mr-1 h-3 w-3" />
              {participants.length}
              {maxTeams != null ? ` / ${maxTeams}` : ''} equipos
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={generating || participants.length < 2} onClick={() => void generateBracket()}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Swords className="mr-2 h-4 w-4" />
            )}
            Generar cuadro
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/o/${slug}/tournaments/${tournamentId}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver cuadro
            </Link>
          </Button>
        </div>
      </div>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inscribir equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="team_name">Nombre del equipo *</Label>
                  <Input
                    id="team_name"
                    placeholder="Equipo Pádel A"
                    value={form.team_name}
                    onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed">Semilla (opcional)</Label>
                  <Input
                    id="seed"
                    type="number"
                    min={1}
                    placeholder="Auto"
                    value={form.seed}
                    onChange={(e) => setForm((f) => ({ ...f, seed: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capitán (opcional)</Label>
                  <Select
                    value={form.captain_id || 'none'}
                    onValueChange={(v) => setForm((f) => ({ ...f, captain_id: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.full_name || m.user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Añadir equipo
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipos inscritos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {participants.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay equipos. Inscribe al menos 2 para generar el cuadro.
            </p>
          ) : (
            participants.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{p.team_name || 'Sin nombre'}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.seed != null ? `Semilla ${p.seed}` : 'Sin semilla'}
                    {p.captain_name ? ` · ${p.captain_name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {PARTICIPANT_STATUS_LABELS[p.status] || p.status}
                  </Badge>
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => void handleRemove(p)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultados de partidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendingMatches.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Pendientes de resultado</p>
                {pendingMatches.map((match) => (
                  <div key={match.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        Ronda {match.round} · Partido {match.match_number}
                      </p>
                      <Badge variant="outline">{MATCH_STATUS_LABELS[match.status]}</Badge>
                    </div>
                    <p className="text-sm">
                      {match.participant1_name} <span className="text-muted-foreground">vs</span>{' '}
                      {match.participant2_name}
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor={`score-${match.id}`}>Marcador (opcional)</Label>
                      <Input
                        id={`score-${match.id}`}
                        placeholder="6-4, 6-3"
                        value={scoreByMatch[match.id] ?? ''}
                        onChange={(e) =>
                          setScoreByMatch((prev) => ({ ...prev, [match.id]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {match.participant1_id && (
                        <Button
                          size="sm"
                          disabled={recordingId === match.id}
                          onClick={() => void recordResult(match, match.participant1_id!)}
                        >
                          Gana {match.participant1_name}
                        </Button>
                      )}
                      {match.participant2_id && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={recordingId === match.id}
                          onClick={() => void recordResult(match, match.participant2_id!)}
                        >
                          Gana {match.participant2_name}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay partidos listos para registrar resultado (esperando equipos en rondas siguientes).
              </p>
            )}

            {closedMatches.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground">Cerrados</p>
                {closedMatches.map((match) => {
                  const winnerName =
                    match.winner_id === match.participant1_id
                      ? match.participant1_name
                      : match.participant2_name
                  return (
                    <div
                      key={match.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-4 py-3 text-sm"
                    >
                      <span>
                        R{match.round} M{match.match_number}: {match.participant1_name} vs{' '}
                        {match.participant2_name}
                      </span>
                      <span className="font-medium text-emerald-700">
                        → {winnerName}
                        {match.score_summary ? ` (${match.score_summary})` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!canEdit && (
        <p className="text-sm text-muted-foreground">
          El torneo ya está en juego o finalizado. No se pueden modificar las inscripciones.
        </p>
      )}
    </div>
  )
}
