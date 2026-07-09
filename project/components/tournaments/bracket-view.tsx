'use client'

import { cn } from '@/lib/utils'
import { MATCH_STATUS_LABELS, type MatchStatus } from '@/lib/tournaments/types'
import type { TournamentMatch } from '@/lib/tournaments/types'

function MatchCard({ match }: { match: TournamentMatch }) {
  const live = match.status === 'in_progress'
  const done = match.status === 'completed' || match.status === 'walkover'
  const statusLabel =
    match.status in MATCH_STATUS_LABELS
      ? MATCH_STATUS_LABELS[match.status as MatchStatus]
      : match.status

  return (
    <div
      className={cn(
        'min-w-[220px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-lg shadow-black/10',
        live && 'border-[color:var(--org-accent)] ring-1 ring-[color:var(--org-accent)]/35',
        done && 'opacity-95'
      )}
    >
      <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        R{match.round} · M{match.match_number}
        {live && <span className="ml-2 text-[color:var(--org-accent)]">En vivo</span>}
        {done && !live && (
          <span className="ml-2 text-[hsl(var(--muted-foreground))]">{statusLabel}</span>
        )}
      </p>
      <div className="space-y-2 text-sm">
        <p
          className={cn(
            'font-medium text-[hsl(var(--card-foreground))]',
            match.winner === match.participant1 && 'text-[color:var(--org-accent)]'
          )}
        >
          {match.participant1 || '—'}
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">vs</p>
        <p
          className={cn(
            'font-medium text-[hsl(var(--card-foreground))]',
            match.winner === match.participant2 && 'text-[color:var(--org-accent)]'
          )}
        >
          {match.participant2 || '—'}
        </p>
      </div>
      {match.score && (
        <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{match.score}</p>
      )}
    </div>
  )
}

export function BracketView({ matches }: { matches: TournamentMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Aún no hay partidos. Genera el cuadro desde el panel de administración.
      </p>
    )
  }

  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b)

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-8">
        {rounds.map((round) => (
          <div key={round} className="flex flex-col justify-around gap-4">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {round === Math.max(...rounds) ? 'Final' : round === Math.max(...rounds) - 1 ? 'Semifinal' : `Ronda ${round}`}
            </p>
            {matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.match_number - b.match_number)
              .map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
