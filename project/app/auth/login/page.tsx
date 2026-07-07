'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getPostLoginPath } from '@/lib/auth/routing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signIn, user, loading, platformAdmin, activeOrganization, isOrgAdmin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  useEffect(() => {
    if (!loading && user) {
      router.replace(getPostLoginPath({ platformAdmin, activeOrganization, isOrgAdmin }, redirect))
    }
  }, [loading, user, platformAdmin, activeOrganization, isOrgAdmin, redirect, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setIsLoading(false)
      }
    } catch {
      setError('Ha ocurrido un error inesperado')
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0f14]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0c0f14] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="mesh-gradient absolute inset-0" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
              <span className="text-sm font-bold text-[#0c0f14]">C</span>
            </div>
            <span className="font-semibold text-white">Community OS</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="font-serif text-4xl leading-tight text-white">
            Bienvenido de nuevo a tu <span className="italic text-amber-400">comunidad</span>
          </h2>
          <p className="mt-4 max-w-sm text-white/50">
            Eventos, deporte, restaurante y socios — todo en un solo lugar.
          </p>
        </div>
        <p className="relative text-xs text-white/30">© 2026 Community OS</p>
      </div>

      <div className="flex flex-col justify-center bg-[#faf9f7] px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#0c0f14]/50 hover:text-[#0c0f14] lg:hidden">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <h1 className="text-2xl font-semibold text-[#0c0f14]">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-[#0c0f14]/55">
            Introduce tu email y contraseña para continuar.
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
                className="h-11 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-white pr-10"
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
              className="h-11 w-full bg-[#0c0f14] text-white hover:bg-[#0c0f14]/90"
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
            <Link href="/auth/signup" className="font-medium text-amber-600 hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
