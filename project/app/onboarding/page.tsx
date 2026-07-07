'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { DEFAULT_TENANT_SLUG, tenantPath } from '@/lib/org/tenant-path'
import { MemberHeader } from '@/components/member/member-header'
import { OrgThemeProvider } from '@/components/member/org-theme-provider'
import { TenantProvider } from '@/contexts/TenantContext'
import { DEMO_ACTIVITIES, DEMO_EVENTS, DEMO_FACILITIES, DEMO_TENANT } from '@/lib/org/demo-tenant'
import { Button } from '@/components/ui/button'
import { Building2, Clock, LogOut, Mail } from 'lucide-react'

export default function OnboardingPage() {
  const { user, profile, activeOrganization, signOut, loading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const reason = searchParams.get('reason')

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a962] border-t-transparent" />
      </div>
    )
  }

  const isMember = reason === 'member' && activeOrganization

  return (
    <TenantProvider slug={DEFAULT_TENANT_SLUG} data={{
      org: DEMO_TENANT,
      events: DEMO_EVENTS,
      facilities: DEMO_FACILITIES,
      activities: DEMO_ACTIVITIES,
      stats: { events: 0, members: 0 },
      demoMode: true,
    }}>
    <OrgThemeProvider org={DEMO_TENANT}>
      <MemberHeader />
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          {isMember ? (
            <Building2 className="h-8 w-8 text-[var(--org-accent)]" />
          ) : (
            <Clock className="h-8 w-8 text-[var(--org-accent)]" />
          )}
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          {isMember ? 'Acceso solo para administradores' : 'Esperando tu organización'}
        </h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          {isMember ? (
            <>
              Eres miembro de <strong className="text-foreground">{activeOrganization?.organization?.name}</strong>,
              pero el panel de administración requiere permisos de propietario o admin.
              Contacta con el administrador de tu organización.
            </>
          ) : (
            <>
              Hola{profile?.full_name ? ` ${profile.full_name}` : ''}. Tu cuenta está lista,
              pero aún no perteneces a ninguna organización.
              Pide a tu club o espacio que te invite.
            </>
          )}
        </p>

        {user?.email && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" style={{ color: 'var(--org-accent)' }} />
            Sesión: {user.email}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={tenantPath(DEFAULT_TENANT_SLUG, '/events')}>
            <Button variant="outline">Ver experiencias públicas</Button>
          </Link>
          <Button variant="ghost" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </OrgThemeProvider>
    </TenantProvider>
  )
}
