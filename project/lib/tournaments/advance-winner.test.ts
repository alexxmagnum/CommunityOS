import { describe, expect, it } from 'vitest'
import {
  applyWinnerAdvancement,
  getNextMatchSlot,
  validateMatchWinner,
} from '@/lib/tournaments/advance-winner'

describe('advance-winner', () => {
  it('calcula la siguiente casilla del cuadro', () => {
    expect(getNextMatchSlot(1, 1)).toEqual({
      round: 2,
      match_number: 1,
      slot: 'participant1_id',
    })
    expect(getNextMatchSlot(1, 2)).toEqual({
      round: 2,
      match_number: 1,
      slot: 'participant2_id',
    })
    expect(getNextMatchSlot(2, 1)).toEqual({
      round: 3,
      match_number: 1,
      slot: 'participant1_id',
    })
  })

  it('avanza ganador a semifinal', () => {
    const matches = [
      { id: 'm1', round: 1, match_number: 1, participant1_id: 'a', participant2_id: 'b', winner_id: null, status: 'pending' },
      { id: 'm2', round: 1, match_number: 2, participant1_id: 'c', participant2_id: 'd', winner_id: null, status: 'pending' },
      { id: 'm3', round: 2, match_number: 1, participant1_id: null, participant2_id: null, winner_id: null, status: 'pending' },
    ]

    const next = applyWinnerAdvancement(matches, 'm1', 'a')
    const semi = next.find((m) => m.id === 'm3')
    expect(semi?.participant1_id).toBe('a')
    expect(next.find((m) => m.id === 'm1')?.status).toBe('completed')
  })

  it('rechaza ganador inválido', () => {
    const err = validateMatchWinner(
      { participant1_id: 'a', participant2_id: 'b', status: 'pending' },
      'z'
    )
    expect(err).toBeTruthy()
  })
})
