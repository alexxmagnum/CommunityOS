import { labelSportName } from '@/lib/i18n/es'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'
import { DEMO_TOURNAMENT_DETAIL, DEMO_TOURNAMENTS } from './demo-tournament'
import type { TournamentDetail, TournamentListItem } from './types'

function parseMatchScore(score: unknown): string | null {
  if (!score || typeof score !== 'object') return null
  if ('summary' in score && typeof (score as { summary?: unknown }).summary === 'string') {
    return (score as { summary: string }).summary
  }
  return null
}

function mapMatch(
  m: Record<string, unknown>,
  participants: Map<string, string>
): TournamentDetail['matches'][0] {
  const p1 = m.participant1_id ? participants.get(m.participant1_id as string) ?? null : null
  const p2 = m.participant2_id ? participants.get(m.participant2_id as string) ?? null : null
  const winnerId = m.winner_id as string | null
  const score = parseMatchScore(m.score)
  return {
    id: m.id as string,
    round: m.round as number,
    match_number: m.match_number as number,
    participant1: p1,
    participant2: p2,
    winner: winnerId ? participants.get(winnerId) ?? null : null,
    status: m.status as string,
    score,
    scheduled_time: m.scheduled_time as string | null,
  }
}

export async function loadTournamentsList(
  organizationId: string,
  demoMode: boolean
): Promise<TournamentListItem[]> {
  if (demoMode || !isSupabaseConfigured()) return DEMO_TOURNAMENTS

  const supabase = getSupabaseClient()
  const { data } = await supabase
    .from('tournaments')
    .select(`
      id, format, status, event_id,
      event:events(title, starts_at),
      sport:sports(name, display_name),
      tournament_participants(count)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  return (data || []).map((t) => {
    const event = Array.isArray(t.event) ? t.event[0] : t.event
    const sport = Array.isArray(t.sport) ? t.sport[0] : t.sport
    return {
      id: t.id,
      name: event?.title ?? 'Torneo',
      format: t.format,
      status: t.status,
      sport_name: labelSportName(sport?.name, sport?.display_name),
      event_id: t.event_id,
      starts_at: event?.starts_at ?? null,
      participant_count: 0,
    }
  }) as TournamentListItem[]
}

export async function loadTournamentDetail(
  organizationId: string,
  tournamentId: string,
  demoMode: boolean
): Promise<TournamentDetail | null> {
  if (demoMode || tournamentId.startsWith('demo-') || !isSupabaseConfigured()) {
    return tournamentId === DEMO_TOURNAMENT_DETAIL.id ? DEMO_TOURNAMENT_DETAIL : null
  }

  const supabase = getSupabaseClient()
  const { data: tournament } = await supabase
    .from('tournaments')
    .select(`
      id, organization_id, event_id, format, status,
      event:events(title, starts_at),
      sport:sports(name, display_name)
    `)
    .eq('id', tournamentId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!tournament) return null

  const event = Array.isArray(tournament.event) ? tournament.event[0] : tournament.event
  const sport = Array.isArray(tournament.sport) ? tournament.sport[0] : tournament.sport

  const { data: participants } = await supabase
    .from('tournament_participants')
    .select('id, team_name, seed, status')
    .eq('tournament_id', tournamentId)
    .order('seed')

  const participantMap = new Map(
    (participants || []).map((p) => [p.id, p.team_name || `Participante ${p.seed}`])
  )

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round')
    .order('match_number')

  const { data: rankings } = await supabase
    .from('rankings')
    .select('points, wins, rank, profile:profiles(full_name)')
    .eq('organization_id', organizationId)
    .order('rank')
    .limit(10)

  return {
    id: tournament.id,
    organization_id: tournament.organization_id,
    event_id: tournament.event_id,
    name: event?.title ?? 'Torneo',
    format: tournament.format,
    status: tournament.status,
    sport_name: labelSportName(sport?.name, sport?.display_name),
    starts_at: event?.starts_at ?? null,
    participants: participants || [],
    matches: (matches || []).map((m) => mapMatch(m, participantMap)),
    rankings: (rankings || []).map((r) => {
      const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile
      return {
        user_name: profile?.full_name || 'Miembro',
        points: r.points ?? 0,
        wins: r.wins ?? 0,
        rank: r.rank,
      }
    }),
  }
}
