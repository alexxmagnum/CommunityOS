import { getSupabaseClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'
import { DEMO_ACHIEVEMENTS, DEMO_HISTORY, type MemberProfileData } from './types'

export async function loadMemberProfile(
  organizationId: string,
  userId: string,
  demoMode: boolean
): Promise<MemberProfileData> {
  if (demoMode || !isSupabaseConfigured()) {
    return {
      full_name: 'Socio demo',
      bio: 'Amante del golf y el pádel.',
      avatar_url: null,
      preferences: { favorite_sports: ['golf', 'padel'], favorite_dishes: ['Burger IKON'] },
      achievements: DEMO_ACHIEVEMENTS,
      history: DEMO_HISTORY,
      demoMode: true,
    }
  }

  const supabase = getSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url, preferences')
    .eq('user_id', userId)
    .maybeSingle()

  const prefs = (profile?.preferences && typeof profile.preferences === 'object'
    ? profile.preferences
    : {}) as MemberProfileData['preferences']

  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('id, name, display_name, description, icon')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)

  const { data: earned } = await supabase
    .from('user_achievements')
    .select('achievement_id, earned_at')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)

  const earnedMap = new Map((earned || []).map((e) => [e.achievement_id, e.earned_at]))

  const achievements = (allAchievements || []).map((a) => ({
    ...a,
    earned: earnedMap.has(a.id),
    earned_at: earnedMap.get(a.id) ?? null,
  }))

  const [reservations, events] = await Promise.all([
    supabase.from('reservations').select('id, reserved_date, status, facility:facilities(name), restaurant:restaurants(name)')
      .eq('organization_id', organizationId).eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('event_participants').select('id, status, event:events(title, starts_at)')
      .eq('organization_id', organizationId).eq('user_id', userId).order('registered_at', { ascending: false }).limit(10),
  ])

  const history = [
    ...(reservations.data || []).map((r) => {
      const facility = Array.isArray(r.facility) ? r.facility[0] : r.facility
      const restaurant = Array.isArray(r.restaurant) ? r.restaurant[0] : r.restaurant
      return {
        id: r.id,
        type: 'reservation' as const,
        title: facility?.name || restaurant?.name || 'Reserva',
        date: r.reserved_date || '',
        status: r.status,
      }
    }),
    ...(events.data || []).map((e) => {
      const event = Array.isArray(e.event) ? e.event[0] : e.event
      return {
        id: e.id,
        type: 'event' as const,
        title: event?.title || 'Evento',
        date: event?.starts_at?.slice(0, 10) || '',
        status: e.status,
      }
    }),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return {
    full_name: profile?.full_name ?? null,
    bio: profile?.bio ?? null,
    avatar_url: profile?.avatar_url ?? null,
    preferences: prefs,
    achievements,
    history,
    demoMode: false,
  }
}

export async function updateMemberPreferences(
  userId: string,
  preferences: Record<string, unknown>
) {
  const supabase = getSupabaseClient()
  return supabase.from('profiles').update({ preferences }).eq('user_id', userId)
}

export async function updateMemberBio(userId: string, bio: string, fullName?: string) {
  const supabase = getSupabaseClient()
  const patch: Record<string, string> = { bio }
  if (fullName) patch.full_name = fullName
  return supabase.from('profiles').update(patch).eq('user_id', userId)
}
