'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Calendar,
  Utensils,
  Trophy,
  Palette,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Building2,
  ExternalLink,
  Users,
  MapPin,
  Settings,
  CalendarCheck,
  ImageIcon,
  Flag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navigation = [
  { name: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Miembros', href: '/dashboard/members', icon: Users },
  { name: 'Eventos', href: '/dashboard/events', icon: Calendar },
  { name: 'Torneos', href: '/dashboard/tournaments', icon: Trophy },
  { name: 'Reservas', href: '/dashboard/reservations', icon: CalendarCheck },
  { name: 'Restaurante', href: '/dashboard/restaurant', icon: Utensils },
  { name: 'Deportes', href: '/dashboard/sports', icon: Flag },
  { name: 'Espacios', href: '/dashboard/venues', icon: MapPin },
  { name: 'Medios', href: '/dashboard/media', icon: ImageIcon },
  { name: 'Marca', href: '/dashboard/branding', icon: Palette },
  { name: 'Ajustes', href: '/dashboard/settings', icon: Settings },
]

export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, activeOrganization, memberships, loading, signOut, setActiveOrganization, isOrgAdmin, profile } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login?redirect=/dashboard')
      return
    }
    if (!activeOrganization) {
      router.replace('/onboarding')
      return
    }
    if (!isOrgAdmin()) {
      router.replace('/onboarding?reason=member')
    }
  }, [loading, user, activeOrganization, isOrgAdmin, router])

  if (loading || !user || !activeOrganization || !isOrgAdmin()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0f14]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    )
  }

  const orgColor = activeOrganization.organization?.primary_color || '#0c0f14'

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-amber-500/15 text-amber-300'
                : 'text-white/55 hover:bg-white/5 hover:text-white'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-[#0c0f14] p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold text-white">{activeOrganization.organization?.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-white/60">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="space-y-1"><NavLinks mobile /></nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 hidden w-64 flex-col bg-[#0c0f14] lg:flex">
        <div className="border-b border-white/10 p-5">
          {memberships.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl p-1 text-left transition-colors hover:bg-white/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: orgColor }}>
                    {activeOrganization.organization?.logo_url ? (
                      <img src={activeOrganization.organization.logo_url} alt="" className="h-7 w-7 rounded-lg object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{activeOrganization.organization?.name}</p>
                    <p className="truncate text-xs text-white/40">{activeOrganization.role?.display_name || 'Administrador'}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Cambiar organización</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {memberships.map((m) => (
                  <DropdownMenuItem key={m.organization_id} onClick={() => setActiveOrganization(m.organization_id)}>
                    {m.organization?.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: orgColor }}>
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{activeOrganization.organization?.name}</p>
                <p className="text-xs text-white/40">{activeOrganization.role?.display_name || 'Administrador'}</p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-4"><NavLinks /></nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-amber-500/20 text-amber-300 text-xs">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{profile?.full_name || 'Administrador'}</p>
              <p className="truncate text-xs text-white/40">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-white/40 hover:text-white">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-[#0c0f14]/8 bg-[#faf9f7]/90 px-4 py-3 backdrop-blur-xl lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[#0c0f14]/45 hover:text-[#0c0f14]">
            <ExternalLink className="h-3.5 w-3.5" />
            Ver sitio
          </Link>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
