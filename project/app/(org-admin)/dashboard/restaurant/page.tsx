'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Search,
  Utensils,
  DollarSign,
  ChefHat,
  Leaf,
  WheatOff,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Grid,
  List
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

interface MenuCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
}

interface Dish {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: string | null
  is_chef_special: boolean
  is_vegetarian: boolean
  is_vegan: boolean
  is_gluten_free: boolean
  is_available: boolean
  sort_order: number
}

export default function RestaurantPage() {
  const { activeOrganization, isOrgAdmin } = useAuth()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [createDishOpen, setCreateDishOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newDish, setNewDish] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_chef_special: false,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
  })

  const supabase = getSupabaseClient()

  async function loadData() {
    if (!activeOrganization) return

    try {
      const orgId = activeOrganization.organization_id

      // Load categories
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('sort_order')

      setCategories(categoriesData || [])

      // Load dishes
      const { data: dishesData } = await supabase
        .from('dishes')
        .select('*')
        .eq('organization_id', orgId)
        .order('sort_order')

      setDishes(dishesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('No se pudo cargar la carta')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeOrganization])

  async function handleCreateDish() {
    if (!newDish.name || !newDish.price) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setCreating(true)
    try {
      const { error } = await supabase
        .from('dishes')
        .insert({
          organization_id: activeOrganization?.organization_id,
          name: newDish.name,
          description: newDish.description || null,
          price: parseFloat(newDish.price),
          category_id: newDish.category_id || null,
          image_url: newDish.image_url || null,
          is_chef_special: newDish.is_chef_special,
          is_vegetarian: newDish.is_vegetarian,
          is_vegan: newDish.is_vegan,
          is_gluten_free: newDish.is_gluten_free,
          is_available: true,
        })

      if (error) throw error

      toast.success('Plato creado correctamente')
      setCreateDishOpen(false)
      setNewDish({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_chef_special: false,
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
      })
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo crear el plato')
    } finally {
      setCreating(false)
    }
  }

  async function deleteDish(dish: Dish) {
    if (!confirm(`¿Eliminar ${dish.name}?`)) return
    const { error } = await supabase.from('dishes').delete().eq('id', dish.id)
    if (error) toast.error(error.message)
    else { toast.success('Eliminado'); loadData() }
  }

  async function toggleDishAvailability(dish: Dish) {
    try {
      const { error } = await supabase
        .from('dishes')
        .update({ is_available: !dish.is_available })
        .eq('id', dish.id)

      if (error) throw error

      toast.success(dish.is_available ? 'Plato marcado como no disponible' : 'Plato marcado como disponible')
      loadData()
    } catch (error) {
      toast.error('No se pudo actualizar el plato')
    }
  }

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || dish.category_id === activeCategory
    return matchesSearch && matchesCategory
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
            <Utensils className="h-6 w-6 text-orange-600" />
            Gestión del restaurante
          </h1>
          <p className="text-slate-500 mt-1">Gestiona tu carta y platos</p>
        </div>
        <div className="flex items-center gap-2">
          {activeOrganization?.organization?.slug && (
            <Link href={`/o/${activeOrganization.organization.slug}/carta`} target="_blank">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Ver carta pública
              </Button>
            </Link>
          )}
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          {isOrgAdmin() && (
            <Dialog open={createDishOpen} onOpenChange={setCreateDishOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir plato
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Añadir nuevo plato</DialogTitle>
                  <DialogDescription>
                    Añade un nuevo elemento a tu carta
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del plato *</Label>
                    <Input
                      id="name"
                      placeholder="Salmón a la plancha"
                      value={newDish.name}
                      onChange={(e) => setNewDish(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Salmón del Atlántico a la plancha..."
                      value={newDish.description}
                      onChange={(e) => setNewDish(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio (EUR) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="24.99"
                        value={newDish.price}
                        onChange={(e) => setNewDish(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Select
                        value={newDish.category_id}
                        onValueChange={(value) => setNewDish(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL de la imagen</Label>
                    <Input
                      id="image_url"
                      placeholder="https://..."
                      value={newDish.image_url}
                      onChange={(e) => setNewDish(prev => ({ ...prev, image_url: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newDish.is_chef_special}
                        onCheckedChange={(checked) => setNewDish(prev => ({ ...prev, is_chef_special: checked }))}
                      />
                      <Label className="font-normal flex items-center gap-1">
                        <ChefHat className="h-4 w-4" /> Especial del chef
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newDish.is_vegetarian}
                        onCheckedChange={(checked) => setNewDish(prev => ({ ...prev, is_vegetarian: checked }))}
                      />
                      <Label className="font-normal flex items-center gap-1">
                        <Leaf className="h-4 w-4" /> Vegetariano
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newDish.is_vegan}
                        onCheckedChange={(checked) => setNewDish(prev => ({ ...prev, is_vegan: checked }))}
                      />
                      <Label className="font-normal">Vegano</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newDish.is_gluten_free}
                        onCheckedChange={(checked) => setNewDish(prev => ({ ...prev, is_gluten_free: checked }))}
                      />
                      <Label className="font-normal flex items-center gap-1">
                        <WheatOff className="h-4 w-4" /> Sin gluten
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDishOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateDish} disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Añadir plato
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar platos..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Dishes Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDishes.map((dish) => (
            <Card key={dish.id} className={`group overflow-hidden ${!dish.is_available ? 'opacity-60' : ''}`}>
              <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                {dish.image_url ? (
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
                {dish.is_chef_special && (
                  <Badge className="absolute top-3 left-3 bg-amber-500">
                    <ChefHat className="h-3 w-3 mr-1" /> Especial del chef
                  </Badge>
                )}
                {!dish.is_available && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                    <Badge variant="secondary">No disponible</Badge>
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleDishAvailability(dish)}>
                      {dish.is_available ? 'Marcar no disponible' : 'Marcar disponible'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => deleteDish(dish)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{dish.name}</h3>
                {dish.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{dish.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-3">
                  {dish.is_vegetarian && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Leaf className="h-3 w-3 mr-1" /> Vegetariano
                    </Badge>
                  )}
                  {dish.is_vegan && (
                    <Badge variant="outline" className="text-green-600 border-green-600">Vegano</Badge>
                  )}
                  {dish.is_gluten_free && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      <WheatOff className="h-3 w-3 mr-1" /> SG
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-blue-600">
                    {dish.price.toFixed(2)} EUR
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredDishes.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No se encontraron platos. Añade tu primer plato para empezar.
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Plato</th>
                  <th className="text-left p-4 font-medium">Categoría</th>
                  <th className="text-left p-4 font-medium">Precio</th>
                  <th className="text-left p-4 font-medium">Estado</th>
                  <th className="text-left p-4 font-medium">Etiquetas</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDishes.map((dish) => (
                  <tr key={dish.id} className={`border-b last:border-0 ${!dish.is_available ? 'opacity-60' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {dish.image_url ? (
                            <img src={dish.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Utensils className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{dish.name}</p>
                          {dish.description && (
                            <p className="text-sm text-slate-500 line-clamp-1">{dish.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">
                        {categories.find(c => c.id === dish.category_id)?.name || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{dish.price.toFixed(2)} EUR</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={dish.is_available ? 'default' : 'secondary'}>
                        {dish.is_available ? 'Disponible' : 'No disponible'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {dish.is_chef_special && <ChefHat className="h-4 w-4 text-amber-500" />}
                        {dish.is_vegetarian && <Leaf className="h-4 w-4 text-green-500" />}
                        {dish.is_gluten_free && <WheatOff className="h-4 w-4 text-amber-500" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleDishAvailability(dish)}>
                            {dish.is_available ? 'Marcar no disponible' : 'Marcar disponible'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteDish(dish)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
