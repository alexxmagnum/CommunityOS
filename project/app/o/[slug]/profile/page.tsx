'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { MemberHeader } from '@/components/member/member-header'
import { AchievementBadges } from '@/components/community/achievement-badges'
import { loadMemberProfile, updateMemberBio } from '@/lib/community/load-member-profile'
import type { MemberProfileData } from '@/lib/community/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, User, History } from 'lucide-react'
import { tenantAuthUrl } from '@/lib/org/tenant-path'
import { assertTenantOrgMatch } from '@/lib/org/tenant-org-id'
import { labelReservationStatus } from '@/lib/i18n/es'
import { toast } from 'sonner'

export default function TenantProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { org, demoMode, path, slug } = useTenant()
  const routeSlug = useParams<{ slug: string }>().slug
  const [data, setData] = useState<MemberProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bio, setBio] = useState('')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    try {
      assertTenantOrgMatch(org, routeSlug)
    } catch {
      setData(null)
      setLoading(false)
      return
    }
    loadMemberProfile(org.id, user.id, demoMode).then((d) => {
      setData(d)
      setBio(d.bio || '')
      setFullName(d.full_name || '')
      setLoading(false)
    })
  }, [user, authLoading, org.id, org.slug, routeSlug, demoMode])

  async function handleSave() {
    if (!user || demoMode) {
      toast.info('Conecta Supabase para guardar cambios')
      return
    }
    setSaving(true)
    const { error } = await updateMemberBio(user.id, bio, fullName)
    if (error) toast.error(error.message)
    else toast.success('Perfil actualizado')
    setSaving(false)
  }

  return (
    <>
      <MemberHeader />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="mt-2 text-muted-foreground">Tu participación en {org.name}</p>

        {authLoading || loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : !user ? (
          <Card className="mt-8">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Inicia sesión para ver tu perfil y logros.</p>
              <Link href={tenantAuthUrl(slug, 'login', path('/profile'))}>
                <Button variant="ghost" className="btn-motanos mt-4">Entrar</Button>
              </Link>
            </CardContent>
          </Card>
        ) : data ? (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5" /> Sobre ti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Nombre</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Bio</label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntanos qué te gusta del club..." rows={3} />
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {data.preferences.favorite_sports?.length ? (
                  <p className="text-sm">Deportes favoritos: {data.preferences.favorite_sports.join(', ')}</p>
                ) : null}
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logros</CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementBadges achievements={data.achievements} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><History className="h-5 w-5" /> Historial</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {data.history.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">Aún no tienes actividad registrada.</p>
                ) : data.history.map((h) => (
                  <div key={h.id} className="flex justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{h.title}</p>
                      <p className="text-muted-foreground capitalize">{h.type} · {h.date}</p>
                    </div>
                    {h.status && <span className="text-xs text-muted-foreground">{labelReservationStatus(h.status)}</span>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Link href={path('/reservations')}><Button variant="outline" size="sm">Mis reservas</Button></Link>
              <Link href={path('/events')}><Button variant="outline" size="sm">Mis experiencias</Button></Link>
              <Link href={path('/tournaments')}><Button variant="outline" size="sm">Torneos</Button></Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
