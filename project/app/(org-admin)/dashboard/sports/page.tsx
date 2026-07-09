'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Trophy,
  Plus,
  Search,
  MapPin,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Calendar
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { SportRulesPanel } from '@/components/admin/sport-rules-panel'
import { formatMoney } from '@/lib/i18n/format-currency'
import { localizeFacility } from '@/lib/i18n/content'
import { useLabels } from '@/contexts/LocaleContext'

interface Sport {
  id: string
  name: string
  display_name: string | null
  icon: string | null
}

interface Facility {
  id: string
  name: string
  description: string | null
  type: string | null
  sport_id: string | null
  is_active: boolean
  booking_config: any
  sport?: Sport
}

export default function SportsPage() {
  const { activeOrganization, isOrgAdmin } = useAuth()
  const { locale } = useLocale()
  const { labelSportName } = useLabels()
  const [sports, setSports] = useState<Sport[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newFacility, setNewFacility] = useState({
    name: '',
    description: '',
    type: 'outdoor',
    sport_id: '',
    booking_duration: '60',
    price_per_hour: '',
  })

  const supabase = getSupabaseClient()

  async function loadData() {
    if (!activeOrganization) return

    try {
      // Load sports
      const { data: sportsData } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      setSports(sportsData || [])

      // Load facilities
      const { data: facilitiesData } = await supabase
        .from('facilities')
        .select('*, sport:sports(*)')
        .eq('organization_id', activeOrganization.organization_id)
        .order('name')

      setFacilities((facilitiesData || []).map((f) => localizeFacility(locale, f)))
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('No se pudieron cargar los datos deportivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeOrganization, locale])

  async function handleCreateFacility() {
    if (!newFacility.name) {
      toast.error('Introduce el nombre de la instalación')
      return
    }

    setCreating(true)
    try {
      const { error } = await supabase
        .from('facilities')
        .insert({
          organization_id: activeOrganization?.organization_id,
          name: newFacility.name,
          description: newFacility.description || null,
          type: newFacility.type,
          sport_id: newFacility.sport_id || null,
          booking_config: {
            duration_minutes: parseInt(newFacility.booking_duration),
            price_per_hour: newFacility.price_per_hour ? parseFloat(newFacility.price_per_hour) : 0,
          },
          is_active: true,
        })

      if (error) throw error

      toast.success('Instalación creada correctamente')
      setCreateOpen(false)
      setNewFacility({
        name: '',
        description: '',
        type: 'outdoor',
        sport_id: '',
        booking_duration: '60',
        price_per_hour: '',
      })
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo crear la instalación')
    } finally {
      setCreating(false)
    }
  }

  async function deleteFacility(facility: Facility) {
    if (!confirm(`¿Eliminar ${facility.name}?`)) return
    const { error } = await supabase.from('facilities').delete().eq('id', facility.id)
    if (error) toast.error(error.message)
    else { toast.success('Eliminado'); loadData() }
  }

  async function toggleFacilityActive(facility: Facility) {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({ is_active: !facility.is_active })
        .eq('id', facility.id)

      if (error) throw error

      toast.success(facility.is_active ? 'Instalación desactivada' : 'Instalación activada')
      loadData()
    } catch (error) {
      toast.error('No se pudo actualizar la instalación')
    }
  }

  const facilityTypeLabels: Record<string, string> = {
    indoor: 'Interior',
    outdoor: 'Exterior',
    covered: 'Cubierta',
    standard: 'Estándar',
  }

  const filteredFacilities = facilities.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchesTab = activeTab === 'all' || f.sport_id === null ||
      (activeTab !== 'all' && sports.find(s => s.id === activeTab)?.id === f.sport_id)
    return matchesSearch && matchesTab
  })

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
            <Trophy className="h-6 w-6 text-amber-600" />
            Deportes e instalaciones
          </h1>
          <p className="text-slate-500 mt-1">Gestiona tus instalaciones deportivas y pistas</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Añadir instalación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Añadir nueva instalación</DialogTitle>
              <DialogDescription>
                Crea una instalación deportiva reservable
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la instalación *</Label>
                <Input
                  id="name"
                  placeholder="Pista de pádel 1"
                  value={newFacility.name}
                  onChange={(e) => setNewFacility(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sport">Deporte</Label>
                  <Select
                    value={newFacility.sport_id}
                    onValueChange={(value) => setNewFacility(prev => ({ ...prev, sport_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar deporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map(sport => (
                        <SelectItem key={sport.id} value={sport.id}>
                          {labelSportName(sport.name, sport.display_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newFacility.type}
                    onValueChange={(value) => setNewFacility(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indoor">Interior</SelectItem>
                      <SelectItem value="outdoor">Exterior</SelectItem>
                      <SelectItem value="covered">Cubierta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Pista acristalada con iluminación LED"
                  value={newFacility.description}
                  onChange={(e) => setNewFacility(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración de la reserva (minutos)</Label>
                  <Select
                    value={newFacility.booking_duration}
                    onValueChange={(value) => setNewFacility(prev => ({ ...prev, booking_duration: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio por hora (EUR)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={newFacility.price_per_hour}
                    onChange={(e) => setNewFacility(prev => ({ ...prev, price_per_hour: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateFacility} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear instalación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar instalaciones..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            {sports.slice(0, 4).map(sport => (
              <TabsTrigger key={sport.id} value={sport.id}>
                {labelSportName(sport.name, sport.display_name)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => (
          <Card key={facility.id} className={!facility.is_active ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{facility.name}</CardTitle>
                    <CardDescription>
                      {labelSportName(facility.sport?.name, facility.sport?.display_name)}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={facility.is_active ? 'default' : 'secondary'}>
                  {facilityTypeLabels[facility.type || 'standard'] || facility.type || 'Estándar'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {facility.description && (
                <p className="text-sm text-slate-500">{facility.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{facility.booking_config?.duration_minutes || 60} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>
                    {formatMoney(facility.booking_config?.price_per_hour ?? 0, { locale })}/h
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Switch
                  checked={facility.is_active}
                  onCheckedChange={() => toggleFacilityActive(facility)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver horario
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => deleteFacility(facility)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredFacilities.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No se encontraron instalaciones. Añade tu primera instalación para empezar.
          </div>
        )}
      </div>

      <SportRulesPanel />
    </div>
  )
}
