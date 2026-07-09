import type { createClient } from '@/lib/supabase/server'

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

export async function canManageOrganization(
  supabase: SupabaseServer,
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
