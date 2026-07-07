'use client'

import { cn } from '@/lib/utils'
import type { TournamentMatch } from '@/lib/tournaments/types'

function MatchCard({ match }: { match: TournamentMatch }) {
  const live = match.status === 'in_progress'
  const done = match.status === 'completed'

  return (
    <div
      className={cn(
        'min-w-[200px] rounded-xl border bg-card p-4 shadow-sm',
        live && 'border-[color:var(--org-accent)] ring-1 ring-[color:var(--org-accent)]/30',
        done && 'opacity-90'
      )}
    >
      <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        R{match.round} · M{match.match_number}
        {live && <span className="ml-2 text-[color:var(--org-accent)]">En vivo</span>}
      </p>
      <div className="space-y-2 text-sm">
        <p className={cn('font-medium', match.winner === match.participant1 && 'text-motanos')}>
          {match.participant1 || '—'}
        </p>
        <p className="text-xs text-muted-foreground">vs</p>
        <p className={cn('font-medium', match.winner === match.participant2 && 'text-motanos')}>
          {match.participant2 || '—'}
        </p>
      </div>
      {match.score && (
        <p className="mt-3 text-xs text-muted-foreground">{match.score}</p>
      )}
    </div>
  )
}

export function BracketView({ matches }: { matches: TournamentMatch[] }) {
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b)

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-8">
        {rounds.map((round) => (
          <div key={round} className="flex flex-col justify-around gap-4">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
