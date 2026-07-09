export type BracketMatch = {
  id: string
  round: number
  match_number: number
  participant1_id: string | null
  participant2_id: string | null
  winner_id: string | null
  status: string
}

export function getNextMatchSlot(round: number, matchNumber: number) {
  return {
    round: round + 1,
    match_number: Math.floor((matchNumber - 1) / 2) + 1,
    slot: (matchNumber - 1) % 2 === 0 ? ('participant1_id' as const) : ('participant2_id' as const),
  }
}

/** Coloca el ganador en el partido de la siguiente ronda (eliminación directa). */
export function applyWinnerAdvancement(
  matches: BracketMatch[],
  completedMatchId: string,
  winnerId: string
): BracketMatch[] {
  const copy = matches.map((m) => ({ ...m }))
  const match = copy.find((m) => m.id === completedMatchId)
  if (!match) return copy

  match.winner_id = winnerId
  match.status = 'completed'

  const maxRound = Math.max(...copy.map((m) => m.round))
  if (match.round >= maxRound) return copy

  const next = getNextMatchSlot(match.round, match.match_number)
  const nextMatch = copy.find((m) => m.round === next.round && m.match_number === next.match_number)
  if (!nextMatch) return copy

  nextMatch[next.slot] = winnerId
  return copy
}

export function validateMatchWinner(
  match: Pick<BracketMatch, 'participant1_id' | 'participant2_id' | 'status'>,
  winnerParticipantId: string
) {
  if (match.status === 'completed' || match.status === 'walkover') {
    return 'Este partido ya está cerrado'
  }
  if (!match.participant1_id || !match.participant2_id) {
    return 'El partido aún no tiene los dos equipos definidos'
  }
  if (
    winnerParticipantId !== match.participant1_id &&
    winnerParticipantId !== match.participant2_id
  ) {
    return 'El ganador debe ser uno de los equipos del partido'
  }
  return null
}

export function getLoserId(
  match: Pick<BracketMatch, 'participant1_id' | 'participant2_id'>,
  winnerParticipantId: string
) {
  if (winnerParticipantId === match.participant1_id) return match.participant2_id
  if (winnerParticipantId === match.participant2_id) return match.participant1_id
  return null
}

export function isTournamentFinalMatch(match: BracketMatch, allMatches: BracketMatch[]) {
  const maxRound = Math.max(...allMatches.map((m) => m.round))
  return match.round === maxRound
}
