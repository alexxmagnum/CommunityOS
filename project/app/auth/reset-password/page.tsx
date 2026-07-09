'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { establishSessionFromHash } from '@/lib/auth/hash-session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseClient()
      const hash = window.location.hash

      if (hash.includes('access_token')) {
        const result = await establishSessionFromHash(supabase, hash)
        window.history.replaceState(null, '', window.location.pathname)

        if (!result.ok || result.type !== 'recovery') {
          setError('El enlace de recuperación no es válido o ha caducado.')
          return
        }

        setReady(true)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
        return
      }

      setError('Abre el enlace del email de recuperación o solicita uno nuevo.')
    }

    void init()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    const supabase = getSupabaseClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    await supabase.auth.signOut()
    router.replace('/auth/login?reset=1')
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#faf9f7] px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/auth/login" className="mb-8 inline-flex items-center gap-2 text-sm text-[#0c0f14]/50 hover:text-[#0c0f14]">
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>

        <h1 className="text-2xl font-semibold text-[#0c0f14]">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-[#0c0f14]/55">
          Elige una contraseña nueva para tu cuenta.
        </p>

        {!ready && !error && (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        )}

        {error && (
          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
            <Link href="/auth/forgot-password">
              <Button variant="outline" className="w-full">
                Solicitar nuevo enlace
              </Button>
            </Link>
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0c0f14]/30"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Repetir contraseña</Label>
              <Input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="h-11 bg-white"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-[#0c0f14] text-white hover:bg-[#0c0f14]/90"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar contraseña'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
