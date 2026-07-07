export type TournamentFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'

export type TournamentStatus =
  | 'registration'
  | 'check_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface TournamentListItem {
  id: string
  name: string
  format: TournamentFormat
  status: TournamentStatus
  sport_name: string | null
  event_id: string
  starts_at: string | null
  participant_count: number
}

export interface TournamentParticipant {
  id: string
  team_name: string | null
  seed: number | null
  status: string
}

export interface TournamentMatch {
  id: string
  round: number
  match_number: number
  participant1: string | null
  participant2: string | null
  winner: string | null
  status: string
  score: string | null
  scheduled_time?: string | null
}

export interface TournamentRanking {
  user_name: string
  points: number
  wins: number
  rank: number | null
}

export interface TournamentDetail {
  id: string
  organization_id: string
  event_id: string
  name: string
  format: TournamentFormat
  status: TournamentStatus
  sport_name: string | null
  starts_at: string | null
  participants: TournamentParticipant[]
  matches: TournamentMatch[]
  rankings: TournamentRanking[]
}

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: 'Eliminación directa',
  double_elimination: 'Doble eliminación',
  round_robin: 'Todos contra todos',
}

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  registration: 'Inscripciones',
  check_in: 'Check-in',
  in_progress: 'En juego',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
}
