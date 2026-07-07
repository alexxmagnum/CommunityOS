'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, ArrowLeft, Check } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()
  const router = useRouter()

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
      const { error } = await signUp(email, password, fullName)
      if (error) {
        setError(error.message.includes('already registered')
          ? 'Ya existe una cuenta con este email'
          : error.message)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/auth/login'), 2500)
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
          <p className="mt-2 text-sm text-[#0c0f14]/55">Redirigiendo al inicio de sesión...</p>
        </div>
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
            Únete a la <span className="italic text-amber-400">comunidad</span> de tu club
          </h2>
          <p className="mt-4 max-w-sm text-white/50">
            Eventos, deporte, gastronomía y más — cuando tu organización te conecte, todo estará aquí.
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

          <h1 className="text-2xl font-semibold text-[#0c0f14]">Crear cuenta</h1>
          <p className="mt-2 text-sm text-[#0c0f14]/55">Gratis. Tu admin te vinculará a la organización.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" type="text" placeholder="María García" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} className="h-11 bg-white" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="h-11 bg-white" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'}
                  placeholder="Mín. 8 caracteres" value={password}
                  onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="h-11 bg-white pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0c0f14]/30 hover:text-[#0c0f14]/60">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { ok: hasMinLength, label: '8+ caracteres' },
                    { ok: hasUppercase, label: 'Mayúscula' },
                    { ok: hasLowercase, label: 'Minúscula' },
                    { ok: hasNumber, label: 'Número' },
                  ].map(({ ok, label }) => (
                    <div key={label} className={`flex items-center gap-1 ${ok ? 'text-emerald-600' : 'text-[#0c0f14]/35'}`}>
                      <Check className={`h-3 w-3 ${ok ? 'opacity-100' : 'opacity-30'}`} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="h-11 w-full bg-[#0c0f14] text-white hover:bg-[#0c0f14]/90" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#0c0f14]/55">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-medium text-amber-600 hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
