import { describe, expect, it } from 'vitest'
import {
  bracketSeedOrder,
  generateRoundRobinMatches,
  generateSingleEliminationMatches,
} from './generate-bracket'

describe('generate-bracket', () => {
  it('genera semillas estándar para 8 equipos', () => {
    expect(bracketSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
  })

  it('genera cuadro de eliminación directa con rondas vacías', () => {
    const participants = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i + 1}`,
      seed: i + 1,
    }))

    const matches = generateSingleEliminationMatches(participants, 'ranking')
    expect(matches.filter((m) => m.round === 1)).toHaveLength(4)
    expect(matches.filter((m) => m.round === 2)).toHaveLength(2)
    expect(matches.filter((m) => m.round === 3)).toHaveLength(1)
    expect(matches[0].participant1_id).toBe('p1')
    expect(matches[0].participant2_id).toBe('p8')
  })

  it('aplica pase directo cuando hay hueco en el cuadro', () => {
    const participants = [
      { id: 'p1', seed: 1 },
      { id: 'p2', seed: 2 },
      { id: 'p3', seed: 3 },
    ]

    const matches = generateSingleEliminationMatches(participants, 'ranking')
    const walkovers = matches.filter((m) => m.status === 'walkover')
    expect(walkovers.length).toBeGreaterThan(0)

    const semifinal = matches.find((m) => m.round === 2 && m.match_number === 1)
    expect(semifinal?.participant1_id || semifinal?.participant2_id).toBeTruthy()
  })

  it('genera todos contra todos', () => {
    const participants = [
      { id: 'a', seed: 1 },
      { id: 'b', seed: 2 },
      { id: 'c', seed: 3 },
      { id: 'd', seed: 4 },
    ]

    const matches = generateRoundRobinMatches(participants)
    expect(matches).toHaveLength(6)
    expect(matches.every((m) => m.round === 1)).toBe(true)
  })
})
