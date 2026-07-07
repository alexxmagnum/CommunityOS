'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Palette,
  Type,
  Image,
  Save,
  Loader2,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

export default function BrandingPage() {
  const { activeOrganization, isOrgAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [branding, setBranding] = useState({
    name: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#1a1a2e',
    secondary_color: '#16213e',
    accent_color: '#0f3460',
    font_family: 'Inter',
    theme_mode: 'light' as 'light' | 'dark' | 'system',
    hero_image_url: '',
    hero_tagline: '',
  })

  const supabase = getSupabaseClient()

  useEffect(() => {
    async function loadBranding() {
      if (!activeOrganization) return

      try {
        const { data } = await supabase
          .from('organizations')
          .select('name, logo_url, favicon_url, primary_color, secondary_color, accent_color, font_family, theme_mode')
          .eq('id', activeOrganization.organization_id)
          .maybeSingle()

        if (data && typeof data === 'object') {
          const org = data as {
            name: string | null
            logo_url: string | null
            favicon_url: string | null
            primary_color: string | null
            secondary_color: string | null
            accent_color: string | null
            font_family: string | null
            theme_mode: string | null
          }
          setBranding({
            name: org.name || '',
            logo_url: org.logo_url || '',
            favicon_url: org.favicon_url || '',
            primary_color: org.primary_color || '#1a1a2e',
            secondary_color: org.secondary_color || '#16213e',
            accent_color: org.accent_color || '#0f3460',
            font_family: org.font_family || 'Inter',
            theme_mode: (org.theme_mode as 'light' | 'dark' | 'system') || 'light',
            hero_image_url: '',
            hero_tagline: '',
          })
        }
      } catch (error) {
        console.error('Error loading branding:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBranding()
  }, [activeOrganization])

  async function handleSave() {
    if (!activeOrganization) return

    setSaving(true)
    try {
      const updateData = {
        name: branding.name,
        logo_url: branding.logo_url || null,
        favicon_url: branding.favicon_url || null,
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        accent_color: branding.accent_color,
        font_family: branding.font_family,
        theme_mode: branding.theme_mode,
      }

      const { error } = await supabase
        .from('organizations')
        .update(updateData as any)
        .eq('id', activeOrganization.organization_id)

      if (error) throw error

      if (branding.hero_image_url || branding.hero_tagline) {
        const heroValue = {
          hero_image_url: branding.hero_image_url || null,
          hero_tagline: branding.hero_tagline || null,
        }
        const { data: existing } = await supabase
          .from('organization_settings')
          .select('id')
          .eq('organization_id', activeOrganization.organization_id)
          .eq('key', 'branding_hero')
          .maybeSingle()

        if (existing?.id) {
          await supabase
            .from('organization_settings')
            .update({ value: heroValue as never, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
        } else {
          await supabase.from('organization_settings').insert({
            organization_id: activeOrganization.organization_id,
            key: 'branding_hero',
            value: heroValue as never,
          })
        }
      }

      toast.success('Marca actualizada correctamente')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo actualizar la marca')
    } finally {
      setSaving(false)
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Palette className="h-6 w-6 text-pink-600" />
          Marca y tema
        </h1>
        <p className="text-slate-500 mt-1">Personaliza la apariencia de tu organización</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo & Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logo e identidad
            </CardTitle>
            <CardDescription>La identidad visual de tu organización</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la organización</Label>
              <Input
                id="name"
                value={branding.name}
                onChange={(e) => setBranding(prev => ({ ...prev, name: e.target.value }))}
                placeholder="IKON Golf Club"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">URL del logo</Label>
              <Input
                id="logo_url"
                value={branding.logo_url}
                onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-slate-500">Recomendado: SVG o PNG con fondo transparente, 200x200px</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="favicon_url">URL del favicon</Label>
              <Input
                id="favicon_url"
                value={branding.favicon_url}
                onChange={(e) => setBranding(prev => ({ ...prev, favicon_url: e.target.value }))}
                placeholder="https://example.com/favicon.ico"
              />
            </div>

            {/* Logo Preview */}
            <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-sm font-medium mb-3">Vista previa</p>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: branding.primary_color }}
                >
                  {branding.logo_url ? (
                    <img src={branding.logo_url} alt="Logotipo" className="w-12 h-12 rounded" />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {branding.name?.[0] || 'O'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{branding.name || 'Nombre de la organización'}</p>
                  <p className="text-sm text-slate-500">Tu eslogan aquí</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Paleta de colores
            </CardTitle>
            <CardDescription>Define los colores de tu marca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary">Principal</Label>
                <div className="relative">
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border"
                    style={{ backgroundColor: branding.primary_color }}
                  />
                  <Input
                    id="primary"
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="pl-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary">Secundario</Label>
                <div className="relative">
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border"
                    style={{ backgroundColor: branding.secondary_color }}
                  />
                  <Input
                    id="secondary"
                    value={branding.secondary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="pl-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent">Acento</Label>
                <div className="relative">
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border"
                    style={{ backgroundColor: branding.accent_color }}
                  />
                  <Input
                    id="accent"
                    value={branding.accent_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="pl-12"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-sm font-medium mb-3">Vista previa de colores</p>
              <div className="flex gap-2">
                <Button size="sm" style={{ backgroundColor: branding.primary_color }}>
                  Botón principal
                </Button>
                <Button size="sm" variant="outline" style={{ borderColor: branding.secondary_color, color: branding.secondary_color }}>
                  Secundario
                </Button>
                <Button size="sm" variant="ghost" style={{ color: branding.accent_color }}>
                  Enlace de acento
                </Button>
              </div>
            </div>

            {/* Predefined Palettes */}
            <div className="mt-4">
              <Label className="mb-3 block">Paletas rápidas</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6', name: 'Azul' },
                  { primary: '#059669', secondary: '#047857', accent: '#10b981', name: 'Verde' },
                  { primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444', name: 'Rojo' },
                  { primary: '#7c3aed', secondary: '#6d28d9', accent: '#8b5cf6', name: 'Violeta' },
                  { primary: '#ca8a04', secondary: '#a16207', accent: '#eab308', name: 'Dorado' },
                  { primary: '#0891b2', secondary: '#0e7490', accent: '#06b6d4', name: 'Cian' },
                  { primary: '#1f2937', secondary: '#111827', accent: '#374151', name: 'Oscuro' },
                  { primary: '#f97316', secondary: '#ea580c', accent: '#fb923c', name: 'Naranja' },
                ].map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => setBranding(prev => ({
                      ...prev,
                      primary_color: palette.primary,
                      secondary_color: palette.secondary,
                      accent_color: palette.accent,
                    }))}
                    className="group relative p-2 rounded-lg border hover:border-slate-300 transition-colors"
                  >
                    <div className="flex gap-1 h-6">
                      <div className="w-4 rounded" style={{ backgroundColor: palette.primary }} />
                      <div className="w-4 rounded" style={{ backgroundColor: palette.secondary }} />
                      <div className="w-4 rounded" style={{ backgroundColor: palette.accent }} />
                    </div>
                    <span className="block text-xs text-slate-500 mt-1">{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Tipografía
            </CardTitle>
            <CardDescription>Fuente y estilo del texto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font_family">Familia tipográfica</Label>
              <select
                id="font_family"
                value={branding.font_family}
                onChange={(e) => setBranding(prev => ({ ...prev, font_family: e.target.value }))}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-background px-3"
              >
                <option value="Inter">Inter</option>
                <option value="system-ui">Sistema</option>
                <option value="Georgia">Georgia</option>
                <option value="Roboto">Roboto</option>
                <option value="Lato">Lato</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>

            {/* Typography Preview */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-sm font-medium mb-3" style={{ fontFamily: branding.font_family }}>Vista previa</p>
              <h3 className="text-2xl font-bold" style={{ fontFamily: branding.font_family }}>
                {branding.name || 'Nombre de la organización'}
              </h3>
              <p className="text-slate-600 mt-1" style={{ fontFamily: branding.font_family }}>
                Así se verá el texto del cuerpo.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Theme Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Hero y portada
            </CardTitle>
            <CardDescription>Imagen y mensaje principal de la homepage del club</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero_image_url">URL imagen hero</Label>
              <Input
                id="hero_image_url"
                value={branding.hero_image_url}
                onChange={(e) => setBranding((prev) => ({ ...prev, hero_image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_tagline">Eslogan / subtítulo</Label>
              <Textarea
                id="hero_tagline"
                rows={2}
                value={branding.hero_tagline}
                onChange={(e) => setBranding((prev) => ({ ...prev, hero_tagline: e.target.value }))}
                placeholder="Experiencias únicas en tu club..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Modo de tema
            </CardTitle>
            <CardDescription>Preferencia de apariencia predeterminada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const themeModeLabels: Record<'light' | 'dark' | 'system', string> = {
                  light: 'Claro',
                  dark: 'Oscuro',
                  system: 'Sistema',
                }
                return (
                <button
                  key={mode}
                  onClick={() => setBranding(prev => ({ ...prev, theme_mode: mode }))}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    branding.theme_mode === mode
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-full h-20 rounded-lg mb-2 ${
                    mode === 'light' ? 'bg-white border' :
                    mode === 'dark' ? 'bg-slate-900' :
                    'bg-gradient-to-r from-white to-slate-900'
                  }`} />
                  <span className="text-sm font-medium">{themeModeLabels[mode]}</span>
                </button>
              )})}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
