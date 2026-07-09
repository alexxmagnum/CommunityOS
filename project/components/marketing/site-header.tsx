'use client'

import Link from 'next/link'
import { useTenantOptional } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { DEFAULT_TENANT_SLUG, tenantPath, tenantDashboardPath } from '@/lib/org/tenant-path'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogOut } from 'lucide-react'

export function SiteHeader() {
  const tenant = useTenantOptional()
  const homeHref = tenant ? tenant.path() : tenantPath(DEFAULT_TENANT_SLUG)
  const eventsHref = tenant ? tenant.path('/events') : tenantPath(DEFAULT_TENANT_SLUG, '/events')

  const { user, loading, signOut, isPlatformAdmin, isOrgAdmin, activeOrganization } = useAuth()

  const panelHref = activeOrganization && isOrgAdmin() && activeOrganization.organization?.slug
    ? tenantDashboardPath(activeOrganization.organization.slug)
    : isPlatformAdmin()
      ? '/platform-admin'
      : '/onboarding'

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href={homeHref} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
            <span className="text-sm font-bold text-[#0c0f14]">C</span>
          </div>
          <span className="font-semibold tracking-tight">Community OS</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href={eventsHref} className="text-sm text-muted-foreground hover:text-foreground">
            Experiencias
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              {(isOrgAdmin() || isPlatformAdmin()) && (
                <Link href={panelHref}>
                  <Button size="sm" variant="ghost">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel
                  </Button>
                </Link>
              )}
              <Button size="sm" variant="ghost" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="sm" variant="ghost">Entrar</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Registrarse</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
