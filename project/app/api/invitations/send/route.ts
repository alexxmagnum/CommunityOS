import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAppOrigin } from '@/lib/email/config'
import { sendInvitationEmail } from '@/lib/email/send-invitation-email'
import { labelRole } from '@/lib/i18n/es'

const bodySchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  roleId: z.string().uuid().optional(),
})

async function canInviteMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  userId: string
) {
  const { data: platformAdmin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (platformAdmin) return true

  const { data: isAdmin, error } = await supabase.rpc('is_org_admin_of', {
    org_id: organizationId,
  })

  if (!error) return Boolean(isAdmin)

  const { data } = await supabase
    .from('organization_members')
    .select('role:roles(name)')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  const role = Array.isArray(data?.role) ? data?.role[0] : data?.role
  const roleName = role?.name
  return roleName === 'org_owner' || roleName === 'org_admin'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Datos de invitación no válidos' }, { status: 400 })
  }

  const canInvite = await canInviteMembers(supabase, body.organizationId, user.id)
  if (!canInvite) {
    return NextResponse.json({ error: 'No tienes permiso para invitar miembros' }, { status: 403 })
  }

  const email = body.email.trim().toLowerCase()

  let roleId = body.roleId
  if (!roleId) {
    const { data: defaultRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'org_member')
      .is('organization_id', null)
      .maybeSingle()
    roleId = defaultRole?.id
  }

  const { data: role } = roleId
    ? await supabase.from('roles').select('name, display_name').eq('id', roleId).maybeSingle()
    : { data: null }

  const { data: organization } = await supabase
    .from('organizations')
    .select('name, slug')
    .eq('id', body.organizationId)
    .maybeSingle()

  if (!organization) {
    return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
  }

  const { data: invite, error: inviteError } = await supabase
    .from('organization_invitations')
    .insert({
      organization_id: body.organizationId,
      email,
      role_id: roleId || null,
      invited_by: user.id,
    })
    .select('token')
    .single()

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: inviteError?.message || 'No se pudo crear la invitación' },
      { status: 400 }
    )
  }

  const origin = getAppOrigin(request)
  const inviteLink = `${origin}/invite/${invite.token}`

  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const emailResult = await sendInvitationEmail({
    to: email,
    organizationName: organization.name,
    inviteLink,
    roleLabel: labelRole(role?.name, role?.display_name),
    invitedByName: inviterProfile?.full_name || user.email,
  })

  return NextResponse.json({
    token: invite.token,
    inviteLink,
    emailSent: emailResult.ok,
    emailError:
      emailResult.ok === false && emailResult.reason === 'provider_error'
        ? emailResult.message
        : null,
  })
}
