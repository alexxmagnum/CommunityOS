'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTenant } from '@/contexts/TenantContext'
import { MemberHeader } from '@/components/member/member-header'
import { BracketView } from '@/components/tournaments/bracket-view'
import { loadTournamentDetail } from '@/lib/tournaments/load-tournament'
import { TOURNAMENT_FORMAT_LABELS, TOURNAMENT_STATUS_LABELS } from '@/lib/tournaments/types'
import type { TournamentDetail } from '@/lib/tournaments/types'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trophy } from 'lucide-react'
import { formatEventDate } from '@/lib/format/dates'

export default function TournamentDetailPage() {
  const params = useParams<{ slug: string; id: string }>()
  const { org, demoMode, path } = useTenant()
  const [tournament, setTournament] = useState<TournamentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTournamentDetail(org.id, params.id, demoMode).then((data) => {
      setTournament(data)
      setLoading(false)
    })
  }, [org.id, params.id, demoMode])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <>
        <MemberHeader />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p>Torneo no encontrado</p>
          <Link href={path('/tournaments')} className="mt-4 inline-block text-sm text-motanos">← Torneos</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <MemberHeader />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link href={path('/tournaments')} className="text-sm text-muted-foreground hover:text-foreground">← Torneos</Link>
        <div className="mt-6 flex flex-wrap items-start gap-3">
          <Trophy className="h-8 w-8 text-motanos" />
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{tournament.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{TOURNAMENT_FORMAT_LABELS[tournament.format]}</Badge>
              <Badge>{TOURNAMENT_STATUS_LABELS[tournament.status]}</Badge>
              {tournament.sport_name && <Badge variant="secondary">{tournament.sport_name}</Badge>}
            </div>
            {tournament.starts_at && (
              <p className="mt-2 text-sm text-muted-foreground">{formatEventDate(tournament.starts_at)}</p>
            )}
          </div>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl">Bracket</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tournament.participants.length} equipos</p>
          <div className="mt-6">
            <BracketView matches={tournament.matches} />
          </div>
        </section>

        {tournament.rankings.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Ranking</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Jugador / Equipo</th>
                    <th className="p-3 text-right">Victorias</th>
                    <th className="p-3 text-right">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.rankings.map((r) => (
                    <tr key={r.user_name} className="border-t">
                      <td className="p-3">{r.rank ?? '—'}</td>
                      <td className="p-3 font-medium">{r.user_name}</td>
                      <td className="p-3 text-right">{r.wins}</td>
                      <td className="p-3 text-right text-motanos">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
