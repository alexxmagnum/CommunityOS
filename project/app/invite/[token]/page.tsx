'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AcceptInvitePage() {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [invite, setInvite] = useState<{ email: string; organization: { name: string; slug: string } | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('get_invitation_public', { p_token: token })

      if (error || !data) {
        setInvite(null)
      } else {
        const payload = data as { email: string; organization: { name: string; slug: string } }
        setInvite({ email: payload.email, organization: payload.organization })
      }
      setLoading(false)
    }
    load()
  }, [token])

  async function accept() {
    if (!user || !invite) return
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      toast.error('Inicia sesión con el correo invitado')
      return
    }

    setAccepting(true)
    const supabase = getSupabaseClient()

    const { data: inv } = await supabase
      .from('organization_invitations')
      .select('id, organization_id, role_id')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle()

    if (!inv) {
      toast.error('Invitación no válida')
      setAccepting(false)
      return
    }

    const { data: existing } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', inv.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      const { error: memberError } = await supabase.from('organization_members').insert({
        organization_id: inv.organization_id,
        user_id: user.id,
        role_id: inv.role_id,
        status: 'active',
      })
      if (memberError) {
        toast.error(memberError.message)
        setAccepting(false)
        return
      }
    } else {
      await supabase.from('organization_members').update({
        role_id: inv.role_id,
        status: 'active',
      }).eq('id', existing.id)
    }

    await supabase.from('organization_invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('id', inv.id)

    toast.success('¡Bienvenido al club!')
    router.push(invite.organization?.slug ? `/o/${invite.organization.slug}` : '/dashboard')
    setAccepting(false)
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center">
            <p className="text-lg font-medium">Invitación no válida o expirada</p>
            <Link href="/" className="mt-4 inline-block text-sm text-amber-600 hover:underline">Ir al inicio</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[#faf9f7]">
      <Card className="max-w-md w-full">
        <CardContent className="space-y-6 py-10 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Invitación a</p>
            <h1 className="text-2xl font-semibold">{invite.organization?.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Para {invite.email}</p>
          </div>
          {!user ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Inicia sesión o regístrate para aceptar</p>
              <Link href={`/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}>
                <Button className="w-full">Iniciar sesión</Button>
              </Link>
              <Link href={`/auth/signup?redirect=${encodeURIComponent(`/invite/${token}`)}`}>
                <Button variant="outline" className="w-full">Crear cuenta</Button>
              </Link>
            </div>
          ) : (
            <Button className="w-full" onClick={accept} disabled={accepting}>
              {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aceptar invitación
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
