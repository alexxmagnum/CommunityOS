import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !serviceKey || serviceKey.includes('placeholder')) {
    return null
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function isAdminClientConfigured() {
  return createAdminClient() !== null
}
