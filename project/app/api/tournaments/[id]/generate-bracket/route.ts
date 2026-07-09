import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateTournamentMatches,
  type SeedingMethod,
} from '@/lib/tournaments/generate-bracket'

async function canManageTournament(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  userId: string
) {
  const { data: platformAdmin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (platformAdmin) return true

  const { data: isAdmin } = await supabase.rpc('is_org_admin_of', {
    org_id: organizationId,
  })

  return Boolean(isAdmin)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: tournamentId } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, organization_id, format, seeding_method, status')
    .eq('id', tournamentId)
    .maybeSingle()

  if (!tournament) {
    return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
  }

  const allowed = await canManageTournament(supabase, tournament.organization_id, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'No tienes permiso para gestionar este torneo' }, { status: 403 })
  }

  const { data: participants } = await supabase
    .from('tournament_participants')
    .select('id, seed')
    .eq('tournament_id', tournamentId)
    .in('status', ['registered', 'checked_in'])
    .order('seed', { ascending: true, nullsFirst: false })

  if (!participants || participants.length < 2) {
    return NextResponse.json(
      { error: 'Se necesitan al menos 2 equipos inscritos para generar el cuadro' },
      { status: 400 }
    )
  }

  const { count: existingMatches } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)

  let replace = false
  try {
    const body = await request.json()
    replace = Boolean(body?.replace)
  } catch {
    replace = false
  }

  if ((existingMatches ?? 0) > 0 && !replace) {
    return NextResponse.json(
      {
        error: 'Este torneo ya tiene partidos. Vuelve a generar con reemplazo activado.',
        code: 'matches_exist',
      },
      { status: 409 }
    )
  }

  if ((existingMatches ?? 0) > 0) {
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }
  }

  const seedingMethod = (tournament.seeding_method ?? 'ranking') as SeedingMethod
  let generated
  try {
    generated = generateTournamentMatches(
      tournament.format,
      participants.map((p) => ({ id: p.id, seed: p.seed })),
      seedingMethod
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo generar el cuadro'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const rows = generated.map((match) => ({
    organization_id: tournament.organization_id,
    tournament_id: tournamentId,
    round: match.round,
    match_number: match.match_number,
    participant1_id: match.participant1_id,
    participant2_id: match.participant2_id,
    winner_id: match.winner_id,
    status: match.status,
    bracket: 'main' as const,
  }))

  const { error: insertError } = await supabase.from('matches').insert(rows)
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  if (tournament.status === 'registration' || tournament.status === 'check_in') {
    await supabase
      .from('tournaments')
      .update({ status: 'in_progress' })
      .eq('id', tournamentId)
  }

  return NextResponse.json({
    ok: true,
    matchCount: rows.length,
    participantCount: participants.length,
  })
}
