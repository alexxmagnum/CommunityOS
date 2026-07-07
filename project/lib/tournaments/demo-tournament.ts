import type { TournamentDetail, TournamentListItem } from './types'

export const DEMO_TOURNAMENT_ID = 'demo-tournament-padel'

export const DEMO_TOURNAMENTS: TournamentListItem[] = [
  {
    id: DEMO_TOURNAMENT_ID,
    name: 'Finales Torneo de Pádel',
    format: 'single_elimination',
    status: 'in_progress',
    sport_name: 'Padel',
    event_id: 'demo-e2',
    starts_at: '2026-07-14T10:00:00.000Z',
    participant_count: 8,
  },
]

export const DEMO_TOURNAMENT_DETAIL: TournamentDetail = {
  id: DEMO_TOURNAMENT_ID,
  organization_id: 'demo-ikon',
  event_id: 'demo-e2',
  name: 'Finales Torneo de Pádel',
  format: 'single_elimination',
  status: 'in_progress',
  sport_name: 'Padel',
  starts_at: '2026-07-14T10:00:00.000Z',
  participants: [
    { id: 'tp1', team_name: 'Equipo García', seed: 1, status: 'registered' },
    { id: 'tp2', team_name: 'Equipo López', seed: 2, status: 'registered' },
    { id: 'tp3', team_name: 'Equipo Martín', seed: 3, status: 'registered' },
    { id: 'tp4', team_name: 'Equipo Ruiz', seed: 4, status: 'registered' },
    { id: 'tp5', team_name: 'Equipo Soto', seed: 5, status: 'registered' },
    { id: 'tp6', team_name: 'Equipo Vega', seed: 6, status: 'registered' },
    { id: 'tp7', team_name: 'Equipo Costa', seed: 7, status: 'registered' },
    { id: 'tp8', team_name: 'Equipo Núñez', seed: 8, status: 'registered' },
  ],
  matches: [
    { id: 'm1', round: 1, match_number: 1, participant1: 'Equipo García', participant2: 'Equipo Núñez', winner: 'Equipo García', status: 'completed', score: '6-4, 6-2' },
    { id: 'm2', round: 1, match_number: 2, participant1: 'Equipo López', participant2: 'Equipo Costa', winner: 'Equipo López', status: 'completed', score: '7-5, 6-3' },
    { id: 'm3', round: 1, match_number: 3, participant1: 'Equipo Martín', participant2: 'Equipo Vega', winner: 'Equipo Vega', status: 'completed', score: '4-6, 6-4, 7-5' },
    { id: 'm4', round: 1, match_number: 4, participant1: 'Equipo Ruiz', participant2: 'Equipo Soto', winner: 'Equipo Ruiz', status: 'completed', score: '6-1, 6-2' },
    { id: 'm5', round: 2, match_number: 1, participant1: 'Equipo García', participant2: 'Equipo López', winner: null, status: 'pending', score: null },
    { id: 'm6', round: 2, match_number: 2, participant1: 'Equipo Vega', participant2: 'Equipo Ruiz', winner: null, status: 'in_progress', score: '3-2' },
    { id: 'm7', round: 3, match_number: 1, participant1: null, participant2: null, winner: null, status: 'pending', score: null },
  ],
  rankings: [
    { user_name: 'Equipo García', points: 120, wins: 4, rank: 1 },
    { user_name: 'Equipo López', points: 95, wins: 3, rank: 2 },
    { user_name: 'Equipo Vega', points: 80, wins: 3, rank: 3 },
  ],
}
