'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Plus,
  Search,
  Clock,
  MapPin,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CalendarDays
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Event {
  id: string
  title: string
  description: string | null
  type: 'event' | 'tournament' | 'workshop' | 'social' | 'competition' | 'experience'
  starts_at: string
  ends_at: string | null
  capacity: number | null
  available_spots: number | null
  price: number
  cover_image_url: string | null
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  is_public: boolean
  location_details: string | null
}

export default function EventsPage() {
  const { activeOrganization, isOrgAdmin } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'event' as Event['type'],
    starts_at_date: '',
    starts_at_time: '',
    capacity: '',
    price: '',
    location: '',
    cover_image_url: '',
    is_public: true,
  })

  const supabase = getSupabaseClient()

  async function loadEvents() {
    if (!activeOrganization) return

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', activeOrganization.organization_id)
        .order('starts_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('No se pudieron cargar los eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [activeOrganization])

  async function handleCreateEvent() {
    if (!newEvent.title || !newEvent.starts_at_date || !newEvent.starts_at_time) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setCreating(true)
    try {
      const startsAt = `${newEvent.starts_at_date}T${newEvent.starts_at_time}:00`

      const { error } = await supabase
        .from('events')
        .insert({
          organization_id: activeOrganization?.organization_id,
          title: newEvent.title,
          description: newEvent.description || null,
          type: newEvent.type,
          starts_at: startsAt,
          capacity: newEvent.capacity ? parseInt(newEvent.capacity) : null,
          available_spots: newEvent.capacity ? parseInt(newEvent.capacity) : null,
          price: newEvent.price ? parseFloat(newEvent.price) : 0,
          location_details: newEvent.location || null,
          cover_image_url: newEvent.cover_image_url || null,
          is_public: newEvent.is_public,
          status: 'draft',
        })

      if (error) throw error

      toast.success('Evento creado correctamente')
      setCreateOpen(false)
      setNewEvent({
        title: '',
        description: '',
        type: 'event',
        starts_at_date: '',
        starts_at_time: '',
        capacity: '',
        price: '',
        location: '',
        cover_image_url: '',
        is_public: true,
      })
      loadEvents()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo crear el evento')
    } finally {
      setCreating(false)
    }
  }

  async function publishEvent(event: Event) {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'published' })
        .eq('id', event.id)

      if (error) throw error

      toast.success('Evento publicado')
      loadEvents()
    } catch (error) {
      toast.error('No se pudo publicar el evento')
    }
  }

  async function deleteEvent(event: Event) {
    if (!confirm(`¿Eliminar "${event.title}"?`)) return
    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id)
      if (error) throw error
      toast.success('Evento eliminado')
      loadEvents()
    } catch {
      toast.error('No se pudo eliminar')
    }
  }

  async function updateEventStatus(event: Event, status: Event['status']) {
    try {
      const { error } = await supabase.from('events').update({ status }).eq('id', event.id)
      if (error) throw error
      toast.success('Actualizado')
      loadEvents()
    } catch {
      toast.error('Error al actualizar')
    }
  }

  async function cancelEvent(event: Event) {
    await updateEventStatus(event, 'cancelled')
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || event.status === filter || event.type === filter
    return matchesSearch && matchesFilter
  })

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const eventTypeLabels: Record<Event['type'], string> = {
    event: 'Evento',
    tournament: 'Torneo',
    workshop: 'Taller',
    social: 'Social',
    competition: 'Competición',
    experience: 'Experiencia',
  }

  const eventStatusLabels: Record<Event['status'], string> = {
    draft: 'Borrador',
    published: 'Publicado',
    cancelled: 'Cancelado',
    completed: 'Finalizado',
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default'
      case 'draft': return 'secondary'
      case 'cancelled': return 'destructive'
      case 'completed': return 'outline'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Eventos y experiencias
          </h1>
          <p className="text-slate-500 mt-1">Crea y gestiona eventos, talleres y experiencias</p>
        </div>
        {isOrgAdmin() && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Crear nuevo evento</DialogTitle>
                <DialogDescription>
                  Configura un evento, taller o experiencia
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del evento *</Label>
                  <Input
                    id="title"
                    placeholder="Cata de vinos"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Únete a una exclusiva cata de vinos..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de evento</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(value: Event['type']) => setNewEvent(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">Evento</SelectItem>
                        <SelectItem value="experience">Experiencia</SelectItem>
                        <SelectItem value="workshop">Taller</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="competition">Competición</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Aforo</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="Sin límite"
                      value={newEvent.capacity}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, capacity: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.starts_at_date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, starts_at_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.starts_at_time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, starts_at_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (EUR)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newEvent.price}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      placeholder="Terraza principal"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newEvent.is_public}
                    onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, is_public: checked }))}
                  />
                  <Label className="font-normal">Evento público (visible para todos los miembros)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateEvent} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear evento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar eventos..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los eventos</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
            <SelectItem value="event">Eventos</SelectItem>
            <SelectItem value="experience">Experiencias</SelectItem>
            <SelectItem value="workshop">Talleres</SelectItem>
            <SelectItem value="social">Sociales</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="group overflow-hidden">
            <div className="relative h-40 bg-slate-100 dark:bg-slate-800">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CalendarDays className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge className="absolute top-3 left-3 capitalize">
                {eventTypeLabels[event.type]}
              </Badge>
              <Badge variant={getStatusColor(event.status)} className="absolute top-3 right-3 capitalize">
                {eventStatusLabels[event.status]}
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                <span>{formatDateTime(event.starts_at)}</span>
              </div>
              {event.location_details && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location_details}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3 text-sm">
                  {event.capacity && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>{event.available_spots}/{event.capacity}</span>
                    </div>
                  )}
                  {event.price > 0 ? (
                    <span className="font-medium">{event.price} EUR</span>
                  ) : (
                    <span className="text-slate-500">Gratis</span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.open(`/events/${event.id}`, '_blank')}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver público
                    </DropdownMenuItem>
                    {event.status === 'draft' && (
                      <DropdownMenuItem onClick={() => publishEvent(event)}>
                        Publicar
                      </DropdownMenuItem>
                    )}
                    {event.status === 'published' && (
                      <DropdownMenuItem onClick={() => cancelEvent(event)} className="text-red-600">
                        Cancelar evento
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => deleteEvent(event)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredEvents.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No se encontraron eventos. Crea tu primer evento para empezar.
          </div>
        )}
      </div>
    </div>
  )
}
