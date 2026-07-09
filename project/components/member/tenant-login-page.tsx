'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { getPostLoginPath } from '@/lib/auth/routing'
import { IKON_BRAND } from '@/lib/org/ikon-brand'
import { isIkonTenant } from '@/lib/org/tenant-experience'
import { getTenantLogoUrl } from '@/lib/org/resolve-theme'
import { tenantAuthUrl } from '@/lib/org/tenant-path'
import { IkonLogo } from '@/components/member/ikon-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function TenantLoginPage() {
  const { org, slug, path } = useTenant()
  const isIkon = isIkonTenant(org)
  const logoUrl = getTenantLogoUrl(org)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signIn, user, loading, authReady, platformAdmin, activeOrganization, isOrgAdmin, memberships, setActiveOrganization } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? path()

  useEffect(() => {
    if (!authReady || !user) return
    const membership = memberships.find((m) => m.organization_id === org.id)
    if (membership) {
      setActiveOrganization(org.id)
    }
  }, [authReady, user, org.id, memberships, setActiveOrganization])

  useEffect(() => {
    if (!authReady || !user) return
    router.replace(getPostLoginPath({ platformAdmin, activeOrganization, isOrgAdmin }, redirect))
  }, [authReady, user, platformAdmin, activeOrganization, isOrgAdmin, redirect, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
      }
    } catch {
      setError('Ha ocurrido un error inesperado')
      setIsLoading(false)
    }
  }

  if (loading && user) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', isIkon ? 'bg-black' : 'bg-[#faf9f7]')}>
        <Loader2 className={cn('h-8 w-8 animate-spin', isIkon ? 'text-[#32E4B5]' : 'text-amber-400')} />
      </div>
    )
  }

  const panelBg = isIkon ? 'bg-black' : 'bg-[#0c0f14]'
  const accentClass = isIkon ? 'text-[#32E4B5]' : 'text-amber-400'

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className={cn('relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12', panelBg)}>
        {isIkon && (
          <>
            <div className="absolute inset-0 bg-[url('/hero/ikon-hero.jpg')] bg-cover bg-center opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/60" />
          </>
        )}
        {!isIkon && <div className="mesh-gradient absolute inset-0 opacity-80" />}

        <div className="relative">
          <Link href={path()} className="inline-flex items-center gap-3">
            {isIkon ? (
              <IkonLogo size="sm" />
            ) : logoUrl ? (
              <img src={logoUrl} alt={org.name} className="h-10 w-auto object-contain" />
            ) : (
              <span className="text-lg font-semibold text-white">{org.name}</span>
            )}
          </Link>
        </div>

        <div className="relative max-w-md">
          {isIkon ? (
            <>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">{IKON_BRAND.tagline}</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-white">
                Bienvenido de nuevo a <span className={accentClass}>IKON</span>
              </h2>
              <p className="mt-4 text-sm text-white/55">
                Accede a eventos, reservas y tu espacio de socio en el club.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-serif text-4xl leading-tight text-white">
                Bienvenido a <span className={accentClass}>{org.name}</span>
              </h2>
              <p className="mt-4 text-sm text-white/55">
                Eventos, reservas y tu comunidad — todo en un solo lugar.
              </p>
            </>
          )}
        </div>

        <p className="relative text-xs text-white/30">© {new Date().getFullYear()} {org.name}</p>
      </div>

      <div className="tenant-auth-light-panel flex flex-col justify-center bg-[#faf9f7] px-6 py-12 text-[#0c0f14] [&_input]:bg-white [&_input]:text-[#0c0f14] [&_input]:placeholder:text-[#0c0f14]/40 [&_label]:text-[#0c0f14]">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href={path()}
            className="mb-8 inline-flex items-center gap-2 text-sm text-[#0c0f14]/50 hover:text-[#0c0f14] lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a {org.name}
          </Link>

          <div className="mb-6 lg:hidden">
            {isIkon ? (
              <IkonLogo size="sm" className="text-[#0c0f14]" />
            ) : (
              <p className="text-lg font-semibold text-[#0c0f14]">{org.name}</p>
            )}
          </div>

          <h1 className="text-2xl font-semibold text-[#0c0f14]">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-[#0c0f14]/55">
            Entra con tu cuenta de socio en {org.name}.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 border-neutral-200 bg-white text-[#0c0f14]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href={`/auth/forgot-password?redirect=${encodeURIComponent(tenantAuthUrl(slug, 'login', redirect))}`}
                  className={cn('text-xs font-medium hover:underline', isIkon ? 'text-[#0d9e7a]' : 'text-amber-600')}
                >
                  ¿Olvidaste la contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 border-neutral-200 bg-white pr-10 text-[#0c0f14]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0c0f14]/30 hover:text-[#0c0f14]/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className={cn(
                'h-11 w-full text-white',
                isIkon ? 'bg-black hover:bg-black/90' : 'bg-[#0c0f14] hover:bg-[#0c0f14]/90',
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#0c0f14]/55">
            ¿No tienes cuenta?{' '}
            <Link
              href={tenantAuthUrl(slug, 'signup', redirect)}
              className={cn('font-medium hover:underline', isIkon ? 'text-[#0d9e7a]' : 'text-amber-600')}
            >
              Regístrate como socio
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
