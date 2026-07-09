'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, BarChart3, Menu, X, LogOut, Shield, Users, CreditCard, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { labelPlatformRole } from '@/lib/i18n/es'

const navigation = [
  { name: 'Panel', href: '/platform-admin', icon: BarChart3 },
  { name: 'Organizaciones', href: '/platform-admin/organizations', icon: Building2 },
  { name: 'Suscripciones', href: '/platform-admin/subscriptions', icon: CreditCard },
  { name: 'Salud', href: '/platform-admin/health', icon: Activity },
  { name: 'Usuarios', href: '/platform-admin/users', icon: Users },
]

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, platformAdmin, loading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/platform/login?redirect=/platform-admin')
      return
    }
    if (!platformAdmin) {
      router.replace('/unauthorized')
    }
  }, [loading, user, platformAdmin, router])

  if (loading || !platformAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0f14]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    )
  }

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
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-[#0c0f14] p-4">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold text-white">Administración de plataforma</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-white/60">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="space-y-1"><NavLinks mobile /></nav>
          </div>
        </div>
      )}

      <aside className="fixed inset-y-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#0c0f14] text-white lg:flex">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Administración de plataforma</p>
              <p className="text-xs text-neutral-400">{labelPlatformRole(platformAdmin.role)}</p>
            </div>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4"><NavLinks /></nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-xs font-medium text-amber-300">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => void signOut('/auth/platform/login?redirect=/platform-admin')} className="text-white/40 hover:text-white">
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
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
