'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Loader2 } from 'lucide-react'

export default function PlatformUsersPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from('profiles').select('id, user_id, full_name, created_at').order('created_at', { ascending: false }).limit(50)
      setProfiles(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Users className="h-6 w-6" />Usuarios</h1>
        <p className="text-muted-foreground mt-1">Perfiles registrados en la plataforma</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/40"><th className="p-4 text-left">Nombre</th><th className="p-4 text-left">ID de usuario</th><th className="p-4 text-left">Registro</th></tr></thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-4 font-medium">{p.full_name || '—'}</td>
                  <td className="p-4"><code className="text-xs">{p.user_id.slice(0, 12)}…</code></td>
                  <td className="p-4 text-muted-foreground">{new Date(p.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
              {profiles.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Sin usuarios</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
