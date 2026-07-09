export interface Achievement {
  id: string
  name: string
  display_name: string
  description: string | null
  icon: string | null
  earned: boolean
  earned_at?: string | null
}

export interface MemberHistoryItem {
  id: string
  type: 'reservation' | 'event' | 'tournament'
  title: string
  date: string
  status?: string
}

export interface MemberProfileData {
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  preferences: {
    favorite_sports?: string[]
    favorite_dishes?: string[]
  }
  achievements: Achievement[]
  history: MemberHistoryItem[]
  demoMode: boolean
}

export const DEMO_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', name: 'first_event', display_name: 'Primera experiencia', description: 'Te apuntaste a tu primer evento', icon: 'star', earned: true, earned_at: '2026-06-01' },
  { id: 'a2', name: 'first_reservation', display_name: 'Primera reserva', description: 'Reservaste instalación o mesa', icon: 'calendar', earned: true, earned_at: '2026-06-15' },
  { id: 'a3', name: 'tournament_player', display_name: 'Competidor', description: 'Participaste en un torneo', icon: 'trophy', earned: false },
  { id: 'a4', name: 'regular_member', display_name: 'Socio activo', description: '5 participaciones en el club', icon: 'users', earned: false },
]

export const DEMO_HISTORY: MemberHistoryItem[] = [
  { id: 'h1', type: 'event', title: 'Cata de vinos en la terraza', date: '2026-07-12', status: 'registered' },
  { id: 'h2', type: 'reservation', title: 'Pista de pádel 1', date: '2026-07-08', status: 'confirmed' },
  { id: 'h3', type: 'tournament', title: 'Final del torneo de pádel', date: '2026-07-14', status: 'registered' },
]
