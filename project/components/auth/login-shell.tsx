'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, LayoutDashboard, Loader2, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getPostLoginPath } from '@/lib/auth/routing'
import { LoginForm } from '@/components/auth/login-form'
import { translateAuthError } from '@/lib/i18n/es'
import { cn } from '@/lib/utils'

export type LoginVariant = 'member' | 'org-admin' | 'platform-admin'

const VARIANT_CONFIG = {
  member: {
    defaultRedirect: null as string | null,
    panelClass: 'bg-[#0c0f14]',
    accentClass: 'text-amber-600',
    accentTextClass: 'text-amber-400',
    buttonClass: 'bg-[#0c0f14] text-white hover:bg-[#0c0f14]/90',
    badge: 'Community OS',
    badgeIcon: (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
        <span className="text-sm font-bold text-[#0c0f14]">C</span>
      </div>
    ),
    title: (
      <>
        Bienvenido de nuevo a tu <span className="italic text-amber-400">comunidad</span>
      </>
    ),
    subtitle: 'Eventos, deporte, restaurante y socios — todo en un solo lugar.',
    formTitle: 'Iniciar sesión',
    formSubtitle: 'Introduce tu email y contraseña para continuar.',
    submitLabel: 'Entrar',
    backHref: '/',
    backLabel: 'Volver al inicio',
    showSignup: true,
    mesh: true,
  },
  'org-admin': {
    defaultRedirect: '/dashboard',
    panelClass: 'bg-[#0a0f14]',
    accentClass: 'text-[#32E4B5]',
    accentTextClass: 'text-[#32E4B5]',
    buttonClass: 'bg-[#0a0f14] text-white hover:bg-[#0a0f14]/90',
    badge: 'Panel del club',
    badgeIcon: (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#32E4B5]/15 ring-1 ring-[#32E4B5]/40">
        <LayoutDashboard className="h-4 w-4 text-[#32E4B5]" />
      </div>
    ),
    title: (
      <>
        Gestiona tu <span className="text-[#32E4B5]">club</span>
      </>
    ),
    subtitle: 'Eventos, socios, reservas, restaurante y marca — todo desde un solo panel.',
    formTitle: 'Acceso administradores',
    formSubtitle: 'Inicia sesión con tu cuenta de propietario o administrador del club.',
    submitLabel: 'Entrar al panel',
    backHref: '/',
    backLabel: 'Volver al inicio',
    showSignup: false,
    mesh: false,
  },
  'platform-admin': {
    defaultRedirect: '/platform-admin',
    panelClass: 'bg-[#120a1f]',
    accentClass: 'text-violet-400',
    accentTextClass: 'text-violet-400',
    buttonClass: 'bg-violet-600 text-white hover:bg-violet-600/90',
    badge: 'Administración de plataforma',
    badgeIcon: (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-400/40">
        <Shield className="h-4 w-4 text-violet-400" />
      </div>
    ),
    title: (
      <>
        Administración de <span className="text-violet-400">plataforma</span>
      </>
    ),
    subtitle: 'Organizaciones, suscripciones, usuarios y salud del sistema multi-tenant.',
    formTitle: 'Acceso plataforma',
    formSubtitle: 'Solo para administradores de Community OS.',
    submitLabel: 'Entrar al panel de plataforma',
    backHref: '/',
    backLabel: 'Salir',
    showSignup: false,
    mesh: false,
  },
} as const

type LoginShellProps = {
  variant: LoginVariant
  defaultRedirect?: string | null
  backHref?: string
  backLabel?: string
  badge?: string
}

export function LoginShell({
  variant,
  defaultRedirect: defaultRedirectOverride,
  backHref: backHrefOverride,
  backLabel: backLabelOverride,
  badge: badgeOverride,
}: LoginShellProps) {
  const config = VARIANT_CONFIG[variant]
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signIn, user, loading, authReady, platformAdmin, activeOrganization, memberships, isOrgAdmin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? defaultRedirectOverride ?? config.defaultRedirect
  const reset = searchParams.get('reset')

  useEffect(() => {
    if (!authReady || !user) return

    if (variant === 'platform-admin' && !platformAdmin) {
      setError('Tu cuenta no tiene acceso de administrador de plataforma.')
      return
    }

    if (variant === 'org-admin' && !isOrgAdmin()) {
      setError('Tu cuenta no tiene permisos de administrador del club.')
      return
    }

    router.replace(getPostLoginPath({ platformAdmin, activeOrganization, memberships, isOrgAdmin }, redirect))
  }, [authReady, user, platformAdmin, activeOrganization, isOrgAdmin, redirect, router, variant])

  async function handleSubmit(email: string, password: string) {
    setError(null)
    setIsLoading(true)

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(translateAuthError(signInError.message))
        setIsLoading(false)
      }
    } catch {
      setError('Ha ocurrido un error inesperado')
      setIsLoading(false)
    }
  }

  if (loading && user) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', config.panelClass)}>
        <Loader2 className={cn('h-8 w-8 animate-spin', config.accentTextClass)} />
      </div>
    )
  }

  const forgotPasswordHref = redirect
    ? `/auth/forgot-password?redirect=${encodeURIComponent(`/auth/${variant === 'member' ? 'login' : variant === 'org-admin' ? 'admin/login' : 'platform/login'}?redirect=${encodeURIComponent(redirect)}`)}`
    : '/auth/forgot-password'

  const backHref = backHrefOverride ?? config.backHref
  const backLabel = backLabelOverride ?? config.backLabel
  const badge = badgeOverride ?? config.badge

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className={cn('relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12', config.panelClass)}>
        {config.mesh && <div className="mesh-gradient absolute inset-0" />}
        {variant === 'org-admin' && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(50,228,181,0.12),transparent_55%)]" />
        )}
        {variant === 'platform-admin' && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.18),transparent_55%)]" />
        )}

        <div className="relative">
          <Link href={backHref} className="flex items-center gap-3">
            {config.badgeIcon}
            <span className="font-semibold text-white">{badge}</span>
          </Link>
        </div>

        <div className="relative">
          <h2 className="font-serif text-4xl leading-tight text-white">{config.title}</h2>
          <p className="mt-4 max-w-sm text-white/50">{config.subtitle}</p>
        </div>

        <p className="relative text-xs text-white/30">© {new Date().getFullYear()} Community OS</p>
      </div>

      <div className="flex flex-col justify-center bg-[#faf9f7] px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href={backHref}
            className="mb-8 inline-flex items-center gap-2 text-sm text-[#0c0f14]/50 hover:text-[#0c0f14] lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>

          <div className="mb-6 flex items-center gap-3 lg:hidden">
            {config.badgeIcon}
            <span className="text-sm font-medium text-[#0c0f14]/70">{badge}</span>
          </div>

          <h1 className="text-2xl font-semibold text-[#0c0f14]">{config.formTitle}</h1>
          <p className="mt-2 text-sm text-[#0c0f14]/55">{config.formSubtitle}</p>

          <LoginForm
            onSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
            reset={reset}
            forgotPasswordHref={forgotPasswordHref}
            accentClass={config.accentClass}
            buttonClass={config.buttonClass}
            submitLabel={config.submitLabel}
            showSignup={config.showSignup}
          />
        </div>
      </div>
    </div>
  )
}
