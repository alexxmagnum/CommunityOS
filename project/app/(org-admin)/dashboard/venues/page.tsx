'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MapPin, Plus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Venue {
  id: string
  name: string
  description: string | null
  type: string
  city: string | null
  country: string | null
  is_active: boolean
}

export default function VenuesPage() {
  const { activeOrganization, isOrgAdmin } = useAuth()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', city: '', country: '' })

  const supabase = getSupabaseClient()

  async function load() {
    if (!activeOrganization) return
    const { data } = await supabase.from('venues').select('*').eq('organization_id', activeOrganization.organization_id).order('name')
    setVenues(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeOrganization])

  async function handleCreate() {
    if (!form.name || !activeOrganization) return
    setSaving(true)
    const { error } = await supabase.from('venues').insert({
      organization_id: activeOrganization.organization_id,
      name: form.name,
      description: form.description || null,
      city: form.city || null,
      country: form.country || null,
      type: 'main',
      is_active: true,
    })
    if (error) toast.error(error.message)
    else { toast.success('Espacio creado'); setOpen(false); setForm({ name: '', description: '', city: '', country: '' }); load() }
    setSaving(false)
  }

  async function toggleActive(venue: Venue) {
    await supabase.from('venues').update({ is_active: !venue.is_active }).eq('id', venue.id)
    load()
  }

  async function deleteVenue(venue: Venue) {
    if (!confirm(`¿Eliminar ${venue.name}?`)) return
    const { error } = await supabase.from('venues').delete().eq('id', venue.id)
    if (error) toast.error(error.message)
    else { toast.success('Eliminado'); load() }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><MapPin className="h-6 w-6 text-amber-600" />Espacios</h1>
          <p className="text-muted-foreground mt-1">Ubicaciones físicas de tu organización</p>
        </div>
        {isOrgAdmin() && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nuevo espacio</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear espacio</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Descripción</Label><Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Ciudad</Label><Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                  <div><Label>País</Label><Input value={form.country} onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {venues.map(v => (
          <Card key={v.id}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <CardTitle className="text-lg">{v.name}</CardTitle>
              {isOrgAdmin() && (
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteVenue(v)}><Trash2 className="h-4 w-4" /></Button>
              )}
            </CardHeader>
            <CardContent>
              {v.description && <p className="text-sm text-muted-foreground mb-2">{v.description}</p>}
              <p className="text-sm">{[v.city, v.country].filter(Boolean).join(', ') || 'Sin ubicación'}</p>
              {isOrgAdmin() && (
                <Button size="sm" variant="outline" className="mt-3" onClick={() => toggleActive(v)}>
                  {v.is_active ? 'Desactivar' : 'Activar'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {venues.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-12">No hay espacios. Ejecuta las migraciones o crea uno.</p>}
      </div>
    </div>
  )
}
