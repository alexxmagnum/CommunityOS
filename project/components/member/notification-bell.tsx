'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTenantOptional } from '@/contexts/TenantContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface NotificationRow {
  id: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export function NotificationBell({ darkNav = false }: { darkNav?: boolean }) {
  const { user } = useAuth()
  const tenant = useTenantOptional()
  const [items, setItems] = useState<NotificationRow[]>([])
  const [unread, setUnread] = useState(0)

  async function load() {
    if (!user) return
    const supabase = getSupabaseClient()
    let query = supabase
      .from('notifications')
      .select('id, title, body, link, read_at, created_at, organization_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12)

    if (tenant?.org?.id) {
      query = query.eq('organization_id', tenant.org.id)
    }

    const { data } = await query
    setItems(data || [])
    setUnread((data || []).filter((n) => !n.read_at).length)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [user, tenant?.org?.id])

  async function markRead(id: string) {
    const supabase = getSupabaseClient()
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  async function markAllRead() {
    if (!user) return
    const supabase = getSupabaseClient()
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
    load()
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={cn('relative h-9 w-9 p-0', darkNav && 'text-white/80 hover:bg-white/10 hover:text-white')}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--org-accent)] px-1 text-[10px] font-bold text-black">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificaciones
          {unread > 0 && (
            <button type="button" onClick={markAllRead} className="text-xs font-normal text-muted-foreground hover:text-foreground">
              Marcar leídas
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">Sin notificaciones</p>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn('flex flex-col items-start gap-0.5', !n.read_at && 'bg-muted/50')}
              onClick={() => markRead(n.id)}
              asChild
            >
              {n.link ? (
                <Link href={n.link}>
                  <span className="font-medium">{n.title}</span>
                  {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                </Link>
              ) : (
                <div>
                  <span className="font-medium">{n.title}</span>
                  {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
