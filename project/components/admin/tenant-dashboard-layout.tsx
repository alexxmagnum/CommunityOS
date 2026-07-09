'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  Building2,
  ExternalLink,
  Users,
  MapPin,
  Settings,
  CalendarCheck,
  ImageIcon,
  Flag,
  FileText,
  CreditCard,
  Plug,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { labelRole } from '@/lib/i18n/es'
import { tenantDashboardPath, tenantPath, tenantAdminLoginUrl } from '@/lib/org/tenant-path'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TenantDashboardSync } from '@/components/admin/tenant-dashboard-sync'

function buildNavigation(slug: string) {
  return [
    { name: 'Panel', segment: '', icon: LayoutDashboard },
    { name: 'Miembros', segment: 'members', icon: Users },
    { name: 'Eventos', segment: 'events', icon: Calendar },
    { name: 'Torneos', segment: 'tournaments', icon: Trophy },
    { name: 'Reservas', segment: 'reservations', icon: CalendarCheck },
    { name: 'Restaurante', segment: 'restaurant', icon: Utensils },
    { name: 'Deportes', segment: 'sports', icon: Flag },
    { name: 'Espacios', segment: 'venues', icon: MapPin },
    { name: 'Medios', segment: 'media', icon: ImageIcon },
    { name: 'Marca', segment: 'branding', icon: Palette },
    { name: 'Legal', segment: 'legal', icon: FileText },
    { name: 'Facturación', segment: 'billing', icon: CreditCard },
    { name: 'Integraciones', segment: 'integrations', icon: Plug },
    { name: 'Ajustes', segment: 'settings', icon: Settings },
  ].map((item) => ({
    ...item,
    href: tenantDashboardPath(slug, item.segment),
  }))
}

export function TenantDashboardLayout({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  const { user, activeOrganization, loading, signOut, isOrgAdminOf, profile } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const navigation = buildNavigation(slug)

  const orgMatchesSlug = activeOrganization?.organization?.slug === slug
  const canAccess = user && orgMatchesSlug && isOrgAdminOf(activeOrganization.organization_id)

  if (loading || !canAccess) {
    return (
      <>
        <TenantDashboardSync slug={slug} />
        <div className="flex min-h-screen items-center justify-center bg-[#0c0f14]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      </>
    )
  }

  const orgColor = activeOrganization.organization?.accent_color || '#32E4B5'
  const orgLogo = activeOrganization.organization?.logo_url
  const dashboardRoot = tenantDashboardPath(slug)

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => {
        const isActive =
          item.href === dashboardRoot
            ? pathname === dashboardRoot
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-neutral-200 hover:bg-white/10 hover:text-white',
            )}
          >
            <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-amber-400' : 'text-neutral-400')} />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <TenantDashboardSync slug={slug} />

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#0c0f14] p-4 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold text-white">{activeOrganization.organization?.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-neutral-300 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto"><NavLinks mobile /></nav>
          </div>
        </div>
      )}

      <aside className="fixed inset-y-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#0c0f14] text-white lg:flex">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10"
              style={{ backgroundColor: `${orgColor}22` }}
            >
              {orgLogo ? (
                <img src={orgLogo} alt="" className="h-7 w-7 rounded-lg object-contain" />
              ) : (
                <Building2 className="h-5 w-5" style={{ color: orgColor }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{activeOrganization.organization?.name}</p>
              <p className="truncate text-xs text-neutral-400">
                {labelRole(activeOrganization.role?.name, activeOrganization.role?.display_name)}
              </p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4"><NavLinks /></nav>

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
              <p className="truncate text-xs text-neutral-400">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void signOut(tenantAdminLoginUrl(slug, pathname || dashboardRoot))}
              className="text-neutral-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-[#0c0f14]/8 bg-[#faf9f7]/90 px-4 py-3 backdrop-blur-xl lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Link
            href={tenantPath(slug)}
            className="flex items-center gap-1.5 text-sm text-[#0c0f14]/45 hover:text-[#0c0f14]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver sitio del club
          </Link>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
