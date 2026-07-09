import type { SupabaseClient } from '@supabase/supabase-js'

export function parseAuthHash(hash: string) {
  if (!hash.startsWith('#')) return null
  const params = new URLSearchParams(hash.slice(1))
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  const type = params.get('type')
  if (!access_token || !refresh_token) return null
  return { access_token, refresh_token, type }
}

export async function establishSessionFromHash(
  supabase: SupabaseClient,
  hash: string,
) {
  const tokens = parseAuthHash(hash)
  if (!tokens) return { ok: false as const, type: null }

  const { error } = await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  })

  if (error) return { ok: false as const, type: tokens.type, error }
  return { ok: true as const, type: tokens.type }
}
