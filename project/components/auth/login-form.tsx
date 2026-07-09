'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type LoginFormProps = {
  onSubmit: (email: string, password: string) => Promise<void>
  error: string | null
  isLoading: boolean
  reset?: string | null
  forgotPasswordHref?: string
  signupHref?: string
  submitLabel?: string
  accentClass?: string
  buttonClass?: string
  showSignup?: boolean
}

export function LoginForm({
  onSubmit,
  error,
  isLoading,
  reset,
  forgotPasswordHref = '/auth/forgot-password',
  signupHref = '/auth/signup',
  submitLabel = 'Entrar',
  accentClass = 'text-amber-600',
  buttonClass = 'bg-[#0c0f14] text-white hover:bg-[#0c0f14]/90',
  showSignup = true,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void onSubmit(email, password)
      }}
      className="mt-8 space-y-5"
    >
      {reset === '1' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Contraseña actualizada. Ya puedes iniciar sesión.
        </div>
      )}
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
                className="h-11 border-neutral-200 bg-white text-[#0c0f14] placeholder:text-[#0c0f14]/40"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link href={forgotPasswordHref} className={cn('text-xs font-medium hover:underline', accentClass)}>
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
            className="h-11 border-neutral-200 bg-white pr-10 text-[#0c0f14] placeholder:text-[#0c0f14]/40"
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

      <Button type="submit" className={cn('h-11 w-full', buttonClass)} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          submitLabel
        )}
      </Button>

      {showSignup && (
        <p className="text-center text-sm text-[#0c0f14]/55">
          ¿No tienes cuenta?{' '}
          <Link href={signupHref} className={cn('font-medium hover:underline', accentClass)}>
            Regístrate gratis
          </Link>
        </p>
      )}
    </form>
  )
}
