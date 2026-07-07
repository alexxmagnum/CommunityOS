import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('='))
    .map(([k, ...v]) => [k.trim(), v.join('=').trim()])
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const endpoints = [
  ['organizations', 'id,name,slug,is_active'],
  ['events', 'id,title'],
]

for (const [table, select] of endpoints) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=5`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const data = await res.json()
  console.log(`\n${table} (status ${res.status}):`, JSON.stringify(data, null, 2))
}
