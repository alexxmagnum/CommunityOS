'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = getSupabaseClient()
    const redirectTo = `${window.location.origin}/auth/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-[#faf9f7] px-6 py-12">
        <div className="mx-auto w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-[#0c0f14]">Revisa tu email</h1>
          <p className="mt-2 text-sm text-[#0c0f14]/55">
            Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para restablecer la contraseña.
          </p>
          <Link href="/auth/login" className="mt-8 inline-block text-sm font-medium text-amber-600 hover:underline">
            Volver al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#faf9f7] px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/auth/login" className="mb-8 inline-flex items-center gap-2 text-sm text-[#0c0f14]/50 hover:text-[#0c0f14]">
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>

        <h1 className="text-2xl font-semibold text-[#0c0f14]">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-[#0c0f14]/55">
          Te enviaremos un enlace para elegir una contraseña nueva.
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 bg-white"
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-[#0c0f14] text-white hover:bg-[#0c0f14]/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar enlace'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
