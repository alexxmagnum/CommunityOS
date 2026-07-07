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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  setActiveOrganization: (orgId: string) => void
  isOrgAdmin: () => boolean
  isPlatformAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberships, setMemberships] = useState<OrganizationMember[]>([])
  const [activeOrganization, setActiveOrganization] = useState<OrganizationMember | null>(null)
  const [platformAdmin, setPlatformAdmin] = useState<PlatformAdmin | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setProfile(null)
        setMemberships([])
        setActiveOrganization(null)
        setPlatformAdmin(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserData(userId: string) {
    setLoading(true)
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      setProfile(profileData)

      const { data: adminData } = await supabase
        .from('platform_admins')
        .select('id, role')
        .eq('user_id', userId)
        .maybeSingle()
      setPlatformAdmin(adminData)

      const { data: membersData } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          role_id,
          status,
          organization:organizations (
            id,
            name,
            slug,
            logo_url,
            primary_color,
            secondary_color,
            accent_color
          ),
          role:roles (
            id,
            name,
            display_name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')

      if (membersData && membersData.length > 0) {
        setMemberships(membersData as unknown as OrganizationMember[])
        const savedOrgId = localStorage.getItem('activeOrganizationId')
        const savedOrg = savedOrgId
          ? membersData.find(m => m.organization_id === savedOrgId)
          : null
        setActiveOrganization((savedOrg || membersData[0]) as unknown as OrganizationMember)
      } else {
        setMemberships([])
        setActiveOrganization(null)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
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

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    setMemberships([])
    setActiveOrganization(null)
    setPlatformAdmin(null)
    localStorage.removeItem('activeOrganizationId')
    router.push('/auth/login')
  }

  function handleSetActiveOrganization(orgId: string) {
    const org = memberships.find(m => m.organization_id === orgId)
    if (org) {
      setActiveOrganization(org)
      localStorage.setItem('activeOrganizationId', orgId)
    }
  }

  function isOrgAdmin() {
    if (!activeOrganization?.role) return false
    return ['org_owner', 'org_admin'].includes(activeOrganization.role.name)
  }

  function isPlatformAdmin() {
    return platformAdmin !== null
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, memberships, activeOrganization, platformAdmin,
      loading, signIn, signUp, signOut,
      setActiveOrganization: handleSetActiveOrganization,
      isOrgAdmin, isPlatformAdmin,
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
