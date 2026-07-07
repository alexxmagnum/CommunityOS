'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Plus, Loader2, Mail } from 'lucide-react'
import { labelMemberStatus } from '@/lib/i18n/es'
import { toast } from 'sonner'

interface Member {
  id: string
  user_id: string
  status: string
  role: { name: string; display_name: string | null } | null
  profile: { full_name: string | null; avatar_url: string | null } | null
}

export default function MembersPage() {
  const { activeOrganization, isOrgAdmin } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string; display_name: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoleId, setInviteRoleId] = useState('')
  const [inviting, setInviting] = useState(false)

  const supabase = getSupabaseClient()

  async function load() {
    if (!activeOrganization) return
    const orgId = activeOrganization.organization_id

    const { data: membersData } = await supabase
      .from('organization_members')
      .select(`id, user_id, status, role:roles(name, display_name)`)
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: false })

    const enriched = await Promise.all((membersData || []).map(async (m) => {
      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('user_id', m.user_id).maybeSingle()
      const role = Array.isArray(m.role) ? m.role[0] : m.role
      return { ...m, role, profile } as Member
    }))

    setMembers(enriched)

    const { data: rolesData } = await supabase.from('roles').select('id, name, display_name').in('name', ['org_owner', 'org_admin', 'org_member'])
    setRoles(rolesData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeOrganization])

  async function handleInvite() {
    if (!inviteEmail || !activeOrganization) return
    setInviting(true)

    const orgId = activeOrganization.organization_id
    const roleId = inviteRoleId || roles.find((r) => r.name === 'org_member')?.id

    const { data: userData } = await supabase.auth.getUser()

    const { data: invite, error } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: orgId,
        email: inviteEmail.trim().toLowerCase(),
        role_id: roleId || null,
        invited_by: userData.user?.id,
      })
      .select('token')
      .single()

    if (error) {
      toast.error(error.message)
      setInviting(false)
      return
    }

    const link = `${window.location.origin}/invite/${invite.token}`
    await navigator.clipboard.writeText(link).catch(() => null)
    toast.success('Invitación creada — enlace copiado al portapapeles')
    setInviteOpen(false)
    setInviteEmail('')
    setInviting(false)
  }

  async function updateMemberRole(memberId: string, roleId: string) {
    const { error } = await supabase.from('organization_members').update({ role_id: roleId }).eq('id', memberId)
    if (error) toast.error(error.message)
    else { toast.success('Rol actualizado'); load() }
  }

  async function updateMemberStatus(memberId: string, status: string) {
    const { error } = await supabase.from('organization_members').update({ status }).eq('id', memberId)
    if (error) toast.error(error.message)
    else { toast.success('Estado actualizado'); load() }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Users className="h-6 w-6 text-amber-600" />Miembros</h1>
          <p className="text-muted-foreground mt-1">{members.length} miembros en la organización</p>
        </div>
        {isOrgAdmin() && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Invitar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invitar miembro</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">
                Se generará un enlace de invitación para compartir por correo o WhatsApp.
              </p>
              <div className="space-y-2">
                <Label>Correo del invitado</Label>
                <Input placeholder="usuario@email.com" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={inviteRoleId || roles.find((r) => r.name === 'org_member')?.id} onValueChange={setInviteRoleId}>
                  <SelectTrigger><SelectValue placeholder="Rol" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.display_name || r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                  {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear invitación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-4 text-left font-medium">Miembro</th>
                <th className="p-4 text-left font-medium">Rol</th>
                <th className="p-4 text-left font-medium">Estado</th>
                {isOrgAdmin() && <th className="p-4 text-left font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="p-4">
                    <p className="font-medium">{m.profile?.full_name || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{m.user_id.slice(0, 8)}…</p>
                  </td>
                  <td className="p-4">
                    {isOrgAdmin() ? (
                      <Select value={m.role?.name ? roles.find(r => r.name === m.role?.name)?.id || '' : ''} onValueChange={(v) => updateMemberRole(m.id, v)}>
                        <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Rol" /></SelectTrigger>
                        <SelectContent>
                          {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.display_name || r.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{m.role?.display_name || m.role?.name || '—'}</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={m.status === 'active' ? 'default' : 'secondary'}>{labelMemberStatus(m.status)}</Badge>
                  </td>
                  {isOrgAdmin() && (
                    <td className="p-4">
                      <Button size="sm" variant="ghost" onClick={() => updateMemberStatus(m.id, m.status === 'active' ? 'suspended' : 'active')}>
                        {m.status === 'active' ? 'Suspender' : 'Activar'}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay miembros. Crea la organización y asigna un propietario desde la administración de plataforma.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
