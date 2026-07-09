'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { BrandTemplateId } from '@/lib/org/brand-templates'
import { applyTemplateToOrganization } from '@/lib/org/persist-branding'
import { BrandTemplatePicker } from '@/components/branding/brand-template-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Loader2, ExternalLink } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { tenantPath } from '@/lib/org/tenant-path'
import Link from 'next/link'
import { labelTier } from '@/lib/i18n/es'
import { modulesForDatabase } from '@/lib/org/tenant-modules'

const MODULE_KEYS = ['restaurant', 'sports', 'events', 'tournaments'] as const

const MODULE_LABELS: Record<(typeof MODULE_KEYS)[number], string> = {
  restaurant: 'Restaurante',
  sports: 'Deportes',
  events: 'Eventos',
  tournaments: 'Torneos',
}

const TIER_OPTIONS = ['trial', 'starter', 'professional', 'enterprise'] as const

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveMemberCount(org: Organization): number {
  if (typeof org.member_count === 'number') return org.member_count
  if (Array.isArray(org.member_count)) return org.member_count[0]?.count ?? 0
  return 0
}

interface Organization {
  id: string
  name: string
  slug: string
  domain: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  theme_mode: string
  is_active: boolean
  subscription_tier: string
  subscription_ends_at: string | null
  modules: Record<string, boolean>
  created_at: string
  member_count?: number | { count: number }[]
}

export default function OrganizationsPage() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    domain: '',
    subscription_tier: 'trial',
    brand_template: 'coastal' as BrandTemplateId,
  })

  const supabase = getSupabaseClient()

  async function loadOrganizations() {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_platform_organizations')
      if (!rpcError && rpcData) {
        const rows = Array.isArray(rpcData)
          ? rpcData
          : typeof rpcData === 'string'
            ? JSON.parse(rpcData)
            : []
        setOrganizations(rows as Organization[])
        return
      }

      if (rpcError) {
        console.warn('[platform-admin] get_platform_organizations:', rpcError.message)
      }

      let query = supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('subscription_tier', filter)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
      toast.error('Error al cargar organizaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [search, filter])

  async function handleCreate() {
    if (!newOrg.name || !newOrg.slug) {
      toast.error('Rellena los campos obligatorios')
      return
    }

    setCreating(true)
    try {
      const slug = slugify(newOrg.slug || newOrg.name)
      if (!slug) {
        toast.error('El identificador URL no es válido')
        setCreating(false)
        return
      }
      const { data: created, error } = await supabase
        .from('organizations')
        .insert({
          name: newOrg.name,
          slug,
          domain: newOrg.domain || null,
          subscription_tier: newOrg.subscription_tier,
          modules: { restaurant: true, sports: true, events: true, tournaments: true },
        })
        .select('id')
        .single()

      if (error) throw error

      if (created) {
        try {
          await applyTemplateToOrganization(supabase, created.id, newOrg.brand_template, newOrg.name, {
            slug,
          })
        } catch (brandError) {
          console.warn('[platform-admin] brand template:', brandError)
          toast.message('Organización creada, pero la plantilla no se aplicó. Configúrala en Marca.')
        }
      }

      if (user && created) {
        const { data: ownerRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'org_owner')
          .is('organization_id', null)
          .maybeSingle()

        if (ownerRole) {
          await supabase.from('organization_members').insert({
            organization_id: created.id,
            user_id: user.id,
            role_id: ownerRole.id,
            status: 'active',
          })
        }
      }

      toast.success('Organización creada con plantilla aplicada')
      setCreateOpen(false)
      setNewOrg({ name: '', slug: '', domain: '', subscription_tier: 'trial', brand_template: 'coastal' })
      loadOrganizations()
    } catch (error: any) {
      console.error('Error creating organization:', error)
      toast.error(error.message || 'Error al crear la organización')
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(org: Organization) {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: !org.is_active })
        .eq('id', org.id)

      if (error) throw error

      toast.success(`Organización ${org.is_active ? 'desactivada' : 'activada'}`)
      loadOrganizations()
    } catch (error) {
      toast.error('Error al actualizar la organización')
    }
  }

  function openEdit(org: Organization) {
    setEditingOrg(org)
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editingOrg) return
    setSavingEdit(true)
    try {
      const { error } = await supabase.from('organizations').update({
        name: editingOrg.name,
        subscription_tier: editingOrg.subscription_tier,
        modules: modulesForDatabase(editingOrg.modules),
        domain: editingOrg.domain,
        is_active: editingOrg.is_active,
      }).eq('id', editingOrg.id)
      if (error) throw error
      toast.success('Organización actualizada')
      setEditOpen(false)
      loadOrganizations()
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar')
    } finally {
      setSavingEdit(false)
    }
  }

  function toggleModule(key: string, enabled: boolean) {
    if (!editingOrg) return
    setEditingOrg({
      ...editingOrg,
      modules: { ...editingOrg.modules, [key]: enabled },
    })
  }

  const filteredOrganizations = organizations.filter(org => {
    if (search) {
      return org.name.toLowerCase().includes(search.toLowerCase()) ||
             org.slug.toLowerCase().includes(search.toLowerCase())
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizaciones</h1>
          <p className="text-slate-500 mt-1">Gestiona todas las organizaciones de la plataforma</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva organización
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear organización</DialogTitle>
              <DialogDescription>
                Añade una nueva organización a la plataforma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la organización *</Label>
                <Input
                  id="name"
                  placeholder="IKON Golf Club"
                  value={newOrg.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setNewOrg(prev => ({
                      ...prev,
                      name,
                      slug: prev.slug || slugify(name),
                    }))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Identificador URL *</Label>
                <Input
                  id="slug"
                  placeholder="ikon-golf-club"
                  value={newOrg.slug}
                  onChange={(e) => setNewOrg(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                />
                <p className="text-xs text-slate-500">
                  Usado en URLs: communityos.app/o/{slugify(newOrg.slug || newOrg.name) || 'slug'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Dominio personalizado</Label>
                <Input
                  id="domain"
                  placeholder="ikon.example.com"
                  value={newOrg.domain}
                  onChange={(e) => setNewOrg(prev => ({ ...prev, domain: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Plantilla de marca</Label>
                <p className="text-xs text-slate-500">
                  La identidad visual se aplica automáticamente al crear el club.
                </p>
                <BrandTemplatePicker
                  compact
                  selectedId={newOrg.brand_template}
                  onSelect={(id) => setNewOrg((prev) => ({ ...prev, brand_template: id }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">Plan de suscripción</Label>
                <Select
                  value={newOrg.subscription_tier}
                  onValueChange={(value) => setNewOrg(prev => ({ ...prev, subscription_tier: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_OPTIONS.map((tier) => (
                      <SelectItem key={tier} value={tier}>{labelTier(tier)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear organización
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar organización</DialogTitle>
              <DialogDescription>Módulos, suscripción y estado</DialogDescription>
            </DialogHeader>
            {editingOrg && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={editingOrg.name} onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Suscripción</Label>
                  <Select value={editingOrg.subscription_tier} onValueChange={(v) => setEditingOrg({ ...editingOrg, subscription_tier: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map((tier) => (
                        <SelectItem key={tier} value={tier}>{labelTier(tier)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Módulos</Label>
                  {MODULE_KEYS.map((key) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span className="text-sm">{MODULE_LABELS[key]}</span>
                      <Switch checked={!!editingOrg.modules?.[key]} onCheckedChange={(v) => toggleModule(key, v)} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm">Activo</span>
                  <Switch checked={editingOrg.is_active} onCheckedChange={(v) => setEditingOrg({ ...editingOrg, is_active: v })} />
                </div>
                <Link href={tenantPath(editingOrg.slug)} target="_blank" className="inline-flex items-center text-sm text-blue-600 hover:underline">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Ver app de la organización
                </Link>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
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
            placeholder="Buscar organizaciones..."
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
            <SelectItem value="all">Todos los planes</SelectItem>
            {TIER_OPTIONS.map((tier) => (
              <SelectItem key={tier} value={tier}>{labelTier(tier)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organización</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Miembros</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No se encontraron organizaciones
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: org.primary_color }}
                        >
                          {org.logo_url ? (
                            <img src={org.logo_url} alt={org.name} className="w-8 h-8 rounded" />
                          ) : (
                            <Building2 className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          {org.domain && (
                            <p className="text-xs text-slate-500">{org.domain}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {org.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          org.subscription_tier === 'enterprise' ? 'default' :
                          org.subscription_tier === 'professional' ? 'secondary' :
                          org.subscription_tier === 'starter' ? 'outline' : 'destructive'
                        }
                      >
                        {labelTier(org.subscription_tier)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{resolveMemberCount(org)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${org.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className="text-sm">{org.is_active ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500">
                        {new Date(org.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={tenantPath(org.slug)} target="_blank">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver organización
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(org)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(org)}>
                            {org.is_active ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
