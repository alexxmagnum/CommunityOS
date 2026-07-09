import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canManageOrganization } from '@/lib/auth/can-org-admin'
import {
  applyWinnerAdvancement,
  getLoserId,
  isTournamentFinalMatch,
  validateMatchWinner,
  type BracketMatch,
} from '@/lib/tournaments/advance-winner'

const bodySchema = z.object({
  winnerParticipantId: z.string().uuid(),
  score: z.string().max(120).optional(),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id: tournamentId, matchId } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Datos del resultado no válidos' }, { status: 400 })
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, organization_id, format, status')
    .eq('id', tournamentId)
    .maybeSingle()

  if (!tournament) {
    return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
  }

  const allowed = await canManageOrganization(supabase, tournament.organization_id, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'No tienes permiso para gestionar este torneo' }, { status: 403 })
  }

  const { data: match } = await supabase
    .from('matches')
    .select('id, round, match_number, participant1_id, participant2_id, winner_id, status')
    .eq('id', matchId)
    .eq('tournament_id', tournamentId)
    .maybeSingle()

  if (!match) {
    return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  }

  const validationError = validateMatchWinner(match, body.winnerParticipantId)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const loserId = getLoserId(match, body.winnerParticipantId)
  const completedAt = new Date().toISOString()
  const scorePayload = body.score?.trim()
    ? { summary: body.score.trim() }
    : null

  const { error: updateError } = await supabase
    .from('matches')
    .update({
      winner_id: body.winnerParticipantId,
      loser_id: loserId,
      status: 'completed',
      score: scorePayload,
      completed_at: completedAt,
    })
    .eq('id', matchId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  if (loserId && tournament.format === 'single_elimination') {
    await supabase
      .from('tournament_participants')
      .update({ status: 'eliminated' })
      .eq('id', loserId)
  }

  const { data: allMatches } = await supabase
    .from('matches')
    .select('id, round, match_number, participant1_id, participant2_id, winner_id, status')
    .eq('tournament_id', tournamentId)

  const bracketMatches = (allMatches ?? []) as BracketMatch[]
  const advanced = applyWinnerAdvancement(bracketMatches, matchId, body.winnerParticipantId)

  const updatedCurrent = advanced.find((m) => m.id === matchId)
  const nextMatch = advanced.find(
    (m) =>
      m.round === match.round + 1 &&
      m.match_number === Math.floor((match.match_number - 1) / 2) + 1
  )

  if (nextMatch && tournament.format === 'single_elimination') {
    const slot =
      (match.match_number - 1) % 2 === 0 ? 'participant1_id' : 'participant2_id'
    const { error: nextError } = await supabase
      .from('matches')
      .update({ [slot]: body.winnerParticipantId })
      .eq('id', nextMatch.id)

    if (nextError) {
      return NextResponse.json({ error: nextError.message }, { status: 400 })
    }
  }

  const isFinal =
    tournament.format === 'single_elimination' &&
    isTournamentFinalMatch(match as BracketMatch, bracketMatches)

  if (isFinal) {
    await supabase.from('tournament_participants').update({ status: 'winner' }).eq('id', body.winnerParticipantId)
    await supabase.from('tournaments').update({ status: 'completed' }).eq('id', tournamentId)
  } else if (tournament.status === 'registration' || tournament.status === 'check_in') {
    await supabase.from('tournaments').update({ status: 'in_progress' }).eq('id', tournamentId)
  }

  return NextResponse.json({
    ok: true,
    matchId,
    winnerParticipantId: body.winnerParticipantId,
    tournamentCompleted: isFinal,
    nextMatchId: nextMatch?.id ?? null,
    matchStatus: updatedCurrent?.status ?? 'completed',
  })
}
