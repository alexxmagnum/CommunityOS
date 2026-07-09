/**
 * Dev only — set a user password without email.
 *
 * Usage:
 *   1. Supabase → Settings → API → copy "service_role" key (secret)
 *   2. Add to project/.env: SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   3. node scripts/set-user-password.mjs allexstazy@gmail.com TuNuevaPass123
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('Usage: node scripts/set-user-password.mjs EMAIL NEW_PASSWORD')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('='))
    .map(([k, ...v]) => [k.trim(), v.join('=').trim()]),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: list, error: listError } = await admin.auth.admin.listUsers()
if (listError) {
  console.error('listUsers:', listError.message)
  process.exit(1)
}

const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!user) {
  console.error(`No user found for ${email}`)
  process.exit(1)
}

const { error } = await admin.auth.admin.updateUserById(user.id, { password })
if (error) {
  console.error('updateUserById:', error.message)
  process.exit(1)
}

console.log(`Password updated for ${email}`)
console.log('Login at http://localhost:3000/auth/login')
