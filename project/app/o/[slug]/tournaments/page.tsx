'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTenant } from '@/contexts/TenantContext'
import { MemberHeader } from '@/components/member/member-header'
import { loadTournamentsList } from '@/lib/tournaments/load-tournament'
import { TOURNAMENT_FORMAT_LABELS, TOURNAMENT_STATUS_LABELS } from '@/lib/tournaments/types'
import type { TournamentListItem } from '@/lib/tournaments/types'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trophy } from 'lucide-react'
import { formatEventDate } from '@/lib/format/dates'
import { EmptySection } from '@/components/member/empty-section'

export default function TournamentsListPage() {
  const { org, demoMode, path } = useTenant()
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTournamentsList(org.id, demoMode).then((data) => {
      setTournaments(data)
      setLoading(false)
    })
  }, [org.id, demoMode])

  return (
    <>
      <MemberHeader />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="label-caps">Competición</p>
        <h1 className="font-display mt-2 text-4xl text-[color:var(--org-primary)]">Torneos</h1>
        <p className="mt-3 text-muted-foreground">Brackets en vivo, rankings y resultados.</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : tournaments.length === 0 ? (
          <div className="mt-10">
            <EmptySection title="No hay torneos activos" description="Vuelve pronto o explora las experiencias del club." actionLabel="Ver eventos" actionHref={path('/events')} />
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={path(`/tournaments/${t.id}`)}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <Trophy className="mt-1 h-6 w-6 text-motanos" />
                  <div>
                    <h2 className="text-xl font-semibold">{t.name}</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{TOURNAMENT_FORMAT_LABELS[t.format]}</Badge>
                      <Badge>{TOURNAMENT_STATUS_LABELS[t.status]}</Badge>
                      {t.sport_name && <span className="text-sm text-muted-foreground">{t.sport_name}</span>}
                    </div>
                    {t.starts_at && <p className="mt-2 text-sm text-muted-foreground">{formatEventDate(t.starts_at)}</p>}
                  </div>
                </div>
                <span className="text-sm font-medium text-motanos">Ver bracket →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
