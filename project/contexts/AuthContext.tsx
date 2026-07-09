'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  bio: string | null
}

interface OrganizationMember {
  id: string
  organization_id: string
  role_id: string | null
  status: string
  organization: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    primary_color: string
    secondary_color: string
    accent_color: string
  } | null
  role: {
    id: string
    name: string
    display_name: string | null
  } | null
}

interface PlatformAdmin {
  id: string
  role: 'owner' | 'admin' | 'support'
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  memberships: OrganizationMember[]
  activeOrganization: OrganizationMember | null
  platformAdmin: PlatformAdmin | null
  loading: boolean
  authReady: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: (returnTo?: string) => Promise<void>
  setActiveOrganization: (orgId: string) => void
  isOrgAdmin: () => boolean
  isOrgAdminOf: (organizationId: string) => boolean
  isPlatformAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function normalizeMemberships(data: unknown): OrganizationMember[] {
  if (!data) return []
  if (Array.isArray(data)) return data as OrganizationMember[]
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown
      return Array.isArray(parsed) ? (parsed as OrganizationMember[]) : []
    } catch {
      return []
    }
  }
  return []
}

async function fetchMemberships(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
): Promise<OrganizationMember[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_memberships')
  if (!rpcError) {
    const fromRpc = normalizeMemberships(rpcData)
    if (fromRpc.length > 0) return fromRpc
  }
  if (rpcError && process.env.NODE_ENV === 'development') {
    console.warn('[Auth] get_my_memberships:', rpcError.message)
  }

  const { data: rows, error: rowsError } = await supabase
    .from('organization_members')
    .select('id, organization_id, role_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (rowsError) {
    console.error('[Auth] organization_members:', rowsError.message)
    return []
  }
  if (!rows?.length) return []

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const [{ data: organization }, { data: role }] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, name, slug, logo_url, primary_color, secondary_color, accent_color')
          .eq('id', row.organization_id)
          .maybeSingle(),
        row.role_id
          ? supabase.from('roles').select('id, name, display_name').eq('id', row.role_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
      return { ...row, organization, role } as OrganizationMember
    }),
  )

  return enriched
}

function resolveSignOutRedirect(returnTo?: string): string {
  if (returnTo) return returnTo
  if (typeof window !== 'undefined') {
    const tenantMatch = window.location.pathname.match(/^\/o\/([^/]+)/)
    if (tenantMatch) return `/o/${tenantMatch[1]}`
  }
  return '/auth/login'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberships, setMemberships] = useState<OrganizationMember[]>([])
  const [activeOrganization, setActiveOrganization] = useState<OrganizationMember | null>(null)
  const [platformAdmin, setPlatformAdmin] = useState<PlatformAdmin | null>(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        void loadUserData(session.user.id)
      } else {
        setLoading(false)
        setAuthReady(true)
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        setAuthReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user && event !== 'INITIAL_SESSION') {
        void loadUserData(session.user.id)
      } else if (!session?.user) {
        setProfile(null)
        setMemberships([])
        setActiveOrganization(null)
        setPlatformAdmin(null)
        setLoading(false)
        setAuthReady(true)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadUserData(userId: string) {
    setLoading(true)
    setAuthReady(false)

    try {
      const [{ data: profileData }, { data: adminData }, membersData] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('platform_admins').select('id, role').eq('user_id', userId).maybeSingle(),
        fetchMemberships(supabase, userId),
      ])

      setProfile(profileData)
      setPlatformAdmin(adminData)

      if (membersData.length > 0) {
        setMemberships(membersData)
        const savedOrgId = localStorage.getItem('activeOrganizationId')
        const savedOrg = savedOrgId
          ? membersData.find((m) => m.organization_id === savedOrgId)
          : null
        setActiveOrganization(savedOrg || membersData[0])
      } else {
        setMemberships([])
        setActiveOrganization(null)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
      setAuthReady(true)
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true)
    setAuthReady(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      setAuthReady(true)
    }
    return { error }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    return { error }
  }

  async function signOut(returnTo?: string) {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    setMemberships([])
    setActiveOrganization(null)
    setPlatformAdmin(null)
    setLoading(false)
    setAuthReady(true)
    localStorage.removeItem('activeOrganizationId')
    router.push(resolveSignOutRedirect(returnTo))
  }

  function handleSetActiveOrganization(orgId: string) {
    const org = memberships.find((m) => m.organization_id === orgId)
    if (org) {
      setActiveOrganization(org)
      localStorage.setItem('activeOrganizationId', orgId)
    }
  }

  function isOrgAdmin() {
    if (!activeOrganization?.role) return false
    return ['org_owner', 'org_admin'].includes(activeOrganization.role.name)
  }

  function isOrgAdminOf(organizationId: string) {
    const membership = memberships.find((m) => m.organization_id === organizationId)
    if (!membership?.role) return false
    return ['org_owner', 'org_admin'].includes(membership.role.name)
  }

  function isPlatformAdmin() {
    return platformAdmin !== null
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, memberships, activeOrganization, platformAdmin,
      loading, authReady, signIn, signUp, signOut,
      setActiveOrganization: handleSetActiveOrganization,
      isOrgAdmin, isOrgAdminOf, isPlatformAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
