export type BracketParticipant = {
  id: string
  seed: number | null
}

export type GeneratedMatch = {
  round: number
  match_number: number
  participant1_id: string | null
  participant2_id: string | null
  winner_id: string | null
  status: 'pending' | 'walkover' | 'completed'
}

export type SeedingMethod = 'random' | 'ranking' | 'manual'

export function nextPowerOfTwo(n: number): number {
  if (n < 1) return 2
  let size = 1
  while (size < n) size *= 2
  return size
}

/** Orden de semillas en posiciones del cuadro (eliminación directa). */
export function bracketSeedOrder(bracketSize: number): number[] {
  if (bracketSize < 2 || (bracketSize & (bracketSize - 1)) !== 0) {
    throw new Error('El tamaño del cuadro debe ser potencia de 2')
  }
  let order = [1]
  while (order.length < bracketSize) {
    const mirror = order.length * 2 + 1
    const next: number[] = []
    for (const seed of order) {
      next.push(seed)
      next.push(mirror - seed)
    }
    order = next
  }
  return order
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function orderParticipants(
  participants: BracketParticipant[],
  method: SeedingMethod
): BracketParticipant[] {
  if (participants.length === 0) return []

  if (method === 'random') {
    return shuffle(participants).map((p, index) => ({
      ...p,
      seed: index + 1,
    }))
  }

  return [...participants].sort((a, b) => {
    const seedA = a.seed ?? Number.MAX_SAFE_INTEGER
    const seedB = b.seed ?? Number.MAX_SAFE_INTEGER
    if (seedA !== seedB) return seedA - seedB
    return a.id.localeCompare(b.id)
  })
}

export function buildBracketSlots(
  participants: BracketParticipant[],
  method: SeedingMethod
): (string | null)[] {
  const ordered = orderParticipants(participants, method)
  const bracketSize = nextPowerOfTwo(ordered.length)
  const positions = bracketSeedOrder(bracketSize)
  const slots: (string | null)[] = Array(bracketSize).fill(null)

  for (let pos = 0; pos < bracketSize; pos++) {
    const seedNumber = positions[pos]
    if (seedNumber <= ordered.length) {
      slots[pos] = ordered[seedNumber - 1].id
    }
  }

  return slots
}

function resolveOpeningMatch(
  participant1_id: string | null,
  participant2_id: string | null
): Pick<GeneratedMatch, 'winner_id' | 'status'> {
  if (participant1_id && participant2_id) {
    return { winner_id: null, status: 'pending' }
  }
  if (participant1_id && !participant2_id) {
    return { winner_id: participant1_id, status: 'walkover' }
  }
  if (!participant1_id && participant2_id) {
    return { winner_id: participant2_id, status: 'walkover' }
  }
  return { winner_id: null, status: 'pending' }
}

export function generateSingleEliminationMatches(
  participants: BracketParticipant[],
  method: SeedingMethod = 'ranking'
): GeneratedMatch[] {
  if (participants.length < 2) {
    throw new Error('Se necesitan al menos 2 participantes para generar el cuadro')
  }

  const slots = buildBracketSlots(participants, method)
  const bracketSize = slots.length
  const totalRounds = Math.log2(bracketSize)
  const matches: GeneratedMatch[] = []

  for (let i = 0; i < bracketSize / 2; i++) {
    const participant1_id = slots[i * 2] ?? null
    const participant2_id = slots[i * 2 + 1] ?? null
    const resolved = resolveOpeningMatch(participant1_id, participant2_id)
    matches.push({
      round: 1,
      match_number: i + 1,
      participant1_id,
      participant2_id,
      ...resolved,
    })
  }

  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / 2 ** round
    for (let matchNumber = 1; matchNumber <= matchesInRound; matchNumber++) {
      matches.push({
        round,
        match_number: matchNumber,
        participant1_id: null,
        participant2_id: null,
        winner_id: null,
        status: 'pending',
      })
    }
  }

  applyWalkoverAdvancement(matches)
  return matches
}

export function generateRoundRobinMatches(participants: BracketParticipant[]): GeneratedMatch[] {
  if (participants.length < 2) {
    throw new Error('Se necesitan al menos 2 participantes para generar el cuadro')
  }

  const ordered = orderParticipants(participants, 'ranking')
  const matches: GeneratedMatch[] = []
  let matchNumber = 1

  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      matches.push({
        round: 1,
        match_number: matchNumber++,
        participant1_id: ordered[i].id,
        participant2_id: ordered[j].id,
        winner_id: null,
        status: 'pending',
      })
    }
  }

  return matches
}

/** Coloca automáticamente los pases directos (bye) en la siguiente ronda. */
export function applyWalkoverAdvancement(matches: GeneratedMatch[]) {
  const byRound = new Map<number, GeneratedMatch[]>()
  for (const match of matches) {
    const roundMatches = byRound.get(match.round) ?? []
    roundMatches.push(match)
    byRound.set(match.round, roundMatches)
  }

  const maxRound = Math.max(...matches.map((m) => m.round))
  for (let round = 1; round < maxRound; round++) {
    const current = (byRound.get(round) ?? []).sort((a, b) => a.match_number - b.match_number)
    const next = (byRound.get(round + 1) ?? []).sort((a, b) => a.match_number - b.match_number)

    current.forEach((match, index) => {
      if (match.status !== 'walkover' || !match.winner_id) return
      const nextMatch = next[Math.floor(index / 2)]
      if (!nextMatch) return
      if (index % 2 === 0) {
        nextMatch.participant1_id = match.winner_id
      } else {
        nextMatch.participant2_id = match.winner_id
      }
    })
  }
}

export function generateTournamentMatches(
  format: string,
  participants: BracketParticipant[],
  seedingMethod: SeedingMethod = 'ranking'
): GeneratedMatch[] {
  if (format === 'round_robin') {
    return generateRoundRobinMatches(participants)
  }
  return generateSingleEliminationMatches(participants, seedingMethod)
}
