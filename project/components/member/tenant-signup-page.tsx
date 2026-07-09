'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { IKON_BRAND } from '@/lib/org/ikon-brand'
import { isIkonTenant } from '@/lib/org/tenant-experience'
import { getTenantLogoUrl } from '@/lib/org/resolve-theme'
import { tenantAuthUrl } from '@/lib/org/tenant-path'
import { IkonLogo } from '@/components/member/ikon-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function TenantSignupPage() {
  const { org, slug, path } = useTenant()
  const isIkon = isIkonTenant(org)
  const logoUrl = getTenantLogoUrl(org)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? path()

  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const passwordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!passwordValid) {
      setError('Crea una contraseña más segura')
      return
    }

    setIsLoading(true)
    try {
      const { error: signUpError } = await signUp(email, password, fullName)
      if (signUpError) {
        setError(
          signUpError.message.includes('already registered')
            ? 'Ya existe una cuenta con este email'
            : signUpError.message,
        )
      } else {
        setSuccess(true)
        setTimeout(() => router.push(tenantAuthUrl(slug, 'login', redirect)), 2500)
      }
    } catch {
      setError('Ha ocurrido un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-[#0c0f14]">Cuenta creada</h2>
          <p className="mt-2 text-sm text-[#0c0f14]/55">Redirigiendo al inicio de sesión de {org.name}...</p>
        </div>
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
          <h2 className="font-serif text-4xl leading-tight text-white">
            Únete a <span className={accentClass}>{isIkon ? 'IKON' : org.name}</span>
          </h2>
          <p className="mt-4 text-sm text-white/55">
            {isIkon ? IKON_BRAND.heroSubtitle : 'Crea tu cuenta de socio y accede a eventos y reservas.'}
          </p>
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

          <h1 className="text-2xl font-semibold text-[#0c0f14]">Registro de socio</h1>
          <p className="mt-2 text-sm text-[#0c0f14]/55">Crea tu cuenta en {org.name}.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Tu nombre"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 border-neutral-200 bg-white text-[#0c0f14]"
              />
            </div>

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
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
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
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#0c0f14]/55">
            ¿Ya tienes cuenta?{' '}
            <Link
              href={tenantAuthUrl(slug, 'login', redirect)}
              className={cn('font-medium hover:underline', isIkon ? 'text-[#0d9e7a]' : 'text-amber-600')}
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
