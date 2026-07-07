'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTenantOptional } from '@/contexts/TenantContext'
import type { TenantOrg } from '@/lib/org/types'
import { IKON_BRAND } from '@/lib/org/ikon-brand'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { segment: '/reservations?sport=golf', label: 'Golf' },
  { segment: '/carta', label: 'Carta' },
  { segment: '/events', label: 'Club' },
  { segment: '/reservations', label: 'Reservar' },
]

const HEADER_BAR_HEIGHT = '4.25rem'
const DEMO_BANNER_HEIGHT = '2rem'

export function MemberHeader({ variant = 'default', hideDemoBanner = false }: { variant?: 'default' | 'transparent'; hideDemoBanner?: boolean }) {
  const tenant = useTenantOptional()
  const org: TenantOrg | null = tenant?.org ?? null
  const demoMode = tenant?.demoMode ?? false
  const path = tenant?.path ?? ((p = '') => p || '/')
  const isIkon = org?.slug === 'ikon'
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const { user, loading, signOut, isOrgAdmin, isPlatformAdmin, activeOrganization } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const adminHref = isPlatformAdmin()
    ? '/platform-admin'
    : activeOrganization && isOrgAdmin()
      ? '/dashboard'
      : '/onboarding'

  if (!org) return null

  const transparent = variant === 'transparent'
  const darkNav = isIkon || transparent

  const showDemoBanner = demoMode && !hideDemoBanner
  const headerOffset = showDemoBanner
    ? `calc(${HEADER_BAR_HEIGHT} + ${DEMO_BANNER_HEIGHT})`
    : HEADER_BAR_HEIGHT

  const headerClass = isIkon
    ? cn(
        'fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black text-white transition-all duration-300',
        scrolled && 'header-scrolled',
      )
    : cn(
        'fixed inset-x-0 top-0 z-50 transition-colors',
        darkNav
          ? 'border-b border-white/10 bg-black text-white'
          : 'border-b border-neutral-200/80 bg-white text-neutral-900',
      )

  return (
    <>
      <header className={headerClass}>
        {showDemoBanner && (
        <div className={cn(
          'border-b px-4 py-1.5 text-center text-[11px] tracking-wide',
          darkNav ? 'border-white/10 bg-black text-white/70' : 'border-cyan-200/40 bg-cyan-50 text-cyan-900/80'
        )}>
          Vista demo ·{' '}
          <Link href="/setup" className="font-medium underline underline-offset-2">Conectar Supabase</Link>
        </div>
      )}
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href={path()} className="header-logo-wrap group flex shrink-0 items-center">
          {isIkon ? (
            <img
              src={`${IKON_BRAND.logoImage}?v=7`}
              alt="IKON Sports & Lounge Sant Jordi"
              className="header-logo-img"
              width={1024}
              height={565}
              decoding="async"
            />
          ) : org.logo_url ? (
            <div className="flex items-center gap-3">
              <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded-full object-cover ring-motanos" />
              <span className={cn('font-display text-xl tracking-wide', darkNav ? 'text-white' : 'text-neutral-900')}>
                {org.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-motanos text-sm font-bold text-black ring-motanos">
                {org.name.slice(0, 1)}
              </div>
              <span className={cn('font-display text-xl tracking-wide', darkNav ? 'text-white' : 'text-neutral-900')}>
                {org.name}
              </span>
            </div>
          )}
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map(({ segment, label }) => (
            <Link
              key={segment}
              href={path(segment)}
              className={cn(
                'text-[13px] font-medium uppercase tracking-[0.12em] transition-colors',
                darkNav ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 lg:flex">
          {!loading && user ? (
            <>
              {(isOrgAdmin() || isPlatformAdmin()) && (
                <Link href={adminHref}>
                  <Button size="sm" variant="ghost" className={cn(darkNav && 'text-white/80 hover:bg-white/10 hover:text-white')}>
                    <LayoutDashboard className="mr-1.5 h-4 w-4" />
                    Panel
                  </Button>
                </Link>
              )}
              <Link href={path('/profile')}>
                <Button size="sm" variant="ghost" className={cn('h-9 w-9 p-0', darkNav && 'text-white/80 hover:bg-white/10 hover:text-white')}>
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={signOut} className={darkNav ? 'text-white/80 hover:bg-white/10 hover:text-white' : undefined}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="sm" variant="ghost" className={cn(darkNav && 'text-white/80 hover:bg-white/10 hover:text-white')}>
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'h-9 rounded-full px-5 text-sm font-medium',
                    isIkon
                      ? 'border border-white/30 bg-transparent text-white/90 hover:border-white/50 hover:bg-white/5 hover:text-white'
                      : 'btn-motanos-outline',
                  )}
                >
                  Socio
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden',
            darkNav ? 'text-white/85 hover:bg-white/10 hover:text-white' : 'text-neutral-700 hover:bg-neutral-100',
          )}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      </header>

      <div className="pointer-events-none shrink-0" style={{ height: headerOffset }} aria-hidden />

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className={cn(
              'fixed right-0 z-[45] flex w-[75%] flex-col overflow-y-auto border-l lg:hidden',
              darkNav ? 'border-white/10 bg-black' : 'border-neutral-200 bg-white',
            )}
            style={{ top: headerOffset }}
          >
        <nav className="flex w-full flex-col px-6 py-5">
          {NAV.map(({ segment, label }) => (
            <Link
              key={segment}
              href={path(segment)}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'mobile-nav-link border-b py-4 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors last:border-b-0',
                darkNav
                  ? 'border-white/10 text-white/75 hover:text-white'
                  : 'border-neutral-200 text-neutral-600 hover:text-neutral-900',
              )}
            >
              {label}
            </Link>
          ))}

          <div className={cn('my-4 h-px', darkNav ? 'bg-white/10' : 'bg-neutral-200')} />

          {!loading && user ? (
            <div className="flex flex-col gap-2">
              {(isOrgAdmin() || isPlatformAdmin()) && (
                <Link href={adminHref} onClick={() => setMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn('h-11 w-full justify-start px-0', darkNav && 'text-white/80 hover:bg-white/5 hover:text-white')}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel
                  </Button>
                </Link>
              )}
              <Link href={path('/profile')} onClick={() => setMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn('h-11 w-full justify-start px-0', darkNav && 'text-white/80 hover:bg-white/5 hover:text-white')}
                >
                  <User className="mr-2 h-4 w-4" />
                  Mi perfil
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  setMenuOpen(false)
                  void signOut()
                }}
                className={cn('h-11 w-full justify-start px-0', darkNav && 'text-white/80 hover:bg-white/5 hover:text-white')}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn('h-11 w-full justify-center', darkNav && 'text-white/85 hover:bg-white/10 hover:text-white')}
                >
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>
                <Button
                  className={cn(
                    'h-11 w-full justify-center rounded-full text-sm font-medium',
                    isIkon
                      ? 'border border-white/30 bg-transparent text-white/90 hover:border-white/50 hover:bg-white/5 hover:text-white'
                      : 'btn-motanos-outline',
                  )}
                >
                  Socio
                </Button>
              </Link>
            </div>
          )}
        </nav>
          </div>
        </>
      )}
    </>
  )
}
