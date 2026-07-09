'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
  applyBrandTemplate,
  getBrandTemplate,
  type BrandTemplateId,
  type BrandingFormState,
} from '@/lib/org/brand-templates'
import { persistBrandingForm } from '@/lib/org/persist-branding'
import { parseBrandingExperience, parseBrandingHero } from '@/lib/org/tenant-experience'
import { BrandPreviewPanel } from '@/components/branding/brand-preview-panel'
import { BrandTemplatePicker } from '@/components/branding/brand-template-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ExternalLink, Loader2, Palette, Save, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const EMPTY_FORM: BrandingFormState = {
  name: '',
  logo_url: '',
  favicon_url: '',
  primary_color: '#1a1a2e',
  secondary_color: '#16213e',
  accent_color: '#0f3460',
  font_family: 'Inter',
  theme_mode: 'light',
  hero_image_url: '',
  hero_tagline: '',
  hero_style: 'standard',
  splash_style: 'none',
  tagline: '',
  hero_eyebrow_kicker: '',
  hero_eyebrow: '',
  hero_title_line_1: '',
  hero_title_line_2: '',
  hero_title_line_3: '',
  hero_title_line_4: '',
  hero_title_mobile: '',
  hero_highlights: '',
  hero_stats: '',
}

export default function BrandingPage() {
  const { activeOrganization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branding, setBranding] = useState<BrandingFormState>(EMPTY_FORM)
  const [slug, setSlug] = useState('')
  const [activeTemplateId, setActiveTemplateId] = useState<BrandTemplateId | null>(null)

  const supabase = getSupabaseClient()
  const isIkon = slug === 'ikon'

  useEffect(() => {
    async function loadBranding() {
      if (!activeOrganization) return

      try {
        const { data } = await supabase
          .from('organizations')
          .select(
            'name, slug, logo_url, favicon_url, primary_color, secondary_color, accent_color, font_family, theme_mode'
          )
          .eq('id', activeOrganization.organization_id)
          .maybeSingle()

        const { data: settings } = await supabase
          .from('organization_settings')
          .select('key, value')
          .eq('organization_id', activeOrganization.organization_id)
          .in('key', ['branding_hero', 'branding_experience', 'branding_meta'])

        const heroSettings = settings?.find((row) => row.key === 'branding_hero')
        const experienceSettings = settings?.find((row) => row.key === 'branding_experience')
        const metaSettings = settings?.find((row) => row.key === 'branding_meta')
        const hero = parseBrandingHero(heroSettings?.value)
        const experience = parseBrandingExperience(experienceSettings?.value)

        const meta = metaSettings?.value as { template_id?: BrandTemplateId } | null
        if (meta?.template_id) setActiveTemplateId(meta.template_id)

        if (data) {
          setSlug(data.slug ?? '')
          const lines = experience.hero_title_lines ?? []
          setBranding({
            ...EMPTY_FORM,
            name: data.name || '',
            logo_url: data.logo_url || '',
            favicon_url: data.favicon_url || '',
            primary_color: data.primary_color || '#1a1a2e',
            secondary_color: data.secondary_color || '#16213e',
            accent_color: data.accent_color || '#0f3460',
            font_family: data.font_family || 'Inter',
            theme_mode: (data.theme_mode as BrandingFormState['theme_mode']) || 'light',
            hero_image_url: hero.hero_image_url || '',
            hero_tagline: hero.hero_tagline || '',
            hero_style: experience.hero_style || 'standard',
            splash_style: experience.splash_style || 'none',
            tagline: experience.tagline ?? '',
            hero_eyebrow_kicker: experience.hero_eyebrow_kicker ?? '',
            hero_eyebrow: experience.hero_eyebrow ?? '',
            hero_title_line_1: lines[0] ?? '',
            hero_title_line_2: lines[1] ?? '',
            hero_title_line_3: lines[2] ?? '',
            hero_title_line_4: lines[3] ?? '',
            hero_title_mobile: experience.hero_title_mobile ?? '',
            hero_highlights: (experience.hero_highlights ?? []).join(', '),
            hero_stats: (experience.hero_stats ?? []).map((s) => `${s.value}|${s.label}`).join('\n'),
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

  function selectTemplate(templateId: BrandTemplateId) {
    const t = getBrandTemplate(templateId)
    if (!t) return

    let form = applyBrandTemplate(t, branding.name)
    if (isIkon) form.splash_style = 'golf'
    setBranding(form)
    setActiveTemplateId(templateId)
    toast.success(`Plantilla «${t.name}» aplicada. Guarda para publicar.`)
  }

  async function handleSave() {
    if (!activeOrganization) return

    setSaving(true)
    try {
      await persistBrandingForm(supabase, activeOrganization.organization_id, branding, {
        templateId: activeTemplateId ?? undefined,
      })
      toast.success('Marca actualizada correctamente')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar la marca'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Palette className="h-6 w-6" />
            Identidad del club
          </h1>
          <p className="mt-1 text-muted-foreground">
            Elige una plantilla premium, personaliza y publica — sin tocar código.
          </p>
        </div>
        {slug && (
          <Button variant="outline" asChild>
            <Link href={`/o/${slug}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver sitio del club
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Plantillas premium
              </CardTitle>
              <CardDescription>
                Punto de partida curado. Luego ajusta colores, textos e imágenes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandTemplatePicker selectedId={activeTemplateId} onSelect={selectTemplate} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo e identidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del club</Label>
                  <Input
                    id="name"
                    value={branding.name}
                    onChange={(e) => setBranding((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Eslogan corto</Label>
                  <Input
                    id="tagline"
                    value={branding.tagline}
                    onChange={(e) => setBranding((p) => ({ ...p, tagline: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL del logo</Label>
                  <Input
                    id="logo_url"
                    value={branding.logo_url}
                    onChange={(e) => setBranding((p) => ({ ...p, logo_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon_url">URL del favicon</Label>
                  <Input
                    id="favicon_url"
                    value={branding.favicon_url}
                    onChange={(e) => setBranding((p) => ({ ...p, favicon_url: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paleta de colores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(['primary_color', 'secondary_color', 'accent_color'] as const).map((key) => (
                  <div key={key} className="space-y-2">
                    <Label>
                      {key === 'primary_color' ? 'Principal' : key === 'secondary_color' ? 'Superficie' : 'Acento'}
                    </Label>
                    <div className="relative">
                      <div
                        className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md border"
                        style={{ backgroundColor: branding[key] }}
                      />
                      <Input
                        value={branding[key]}
                        onChange={(e) => setBranding((p) => ({ ...p, [key]: e.target.value }))}
                        className="pl-12"
                      />
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="font_family">Fuente de títulos</Label>
                  <select
                    id="font_family"
                    value={branding.font_family}
                    onChange={(e) => setBranding((p) => ({ ...p, font_family: e.target.value }))}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  >
                    <option value="Instrument Serif">Instrument Serif</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Inter">Inter</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme_mode">Modo</Label>
                  <select
                    id="theme_mode"
                    value={branding.theme_mode}
                    onChange={(e) =>
                      setBranding((p) => ({
                        ...p,
                        theme_mode: e.target.value as BrandingFormState['theme_mode'],
                      }))
                    }
                    className="h-10 w-full rounded-md border bg-background px-3"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="system">Sistema</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Portada y cabecera</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hero_style">Estilo de portada</Label>
                  <select
                    id="hero_style"
                    value={branding.hero_style}
                    onChange={(e) =>
                      setBranding((p) => ({
                        ...p,
                        hero_style: e.target.value as BrandingFormState['hero_style'],
                      }))
                    }
                    className="h-10 w-full rounded-md border bg-background px-3"
                  >
                    <option value="standard">Estándar</option>
                    <option value="cinematic">Cinemático (premium)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="splash_style">Animación de entrada</Label>
                  <select
                    id="splash_style"
                    value={branding.splash_style}
                    onChange={(e) =>
                      setBranding((p) => ({
                        ...p,
                        splash_style: e.target.value as BrandingFormState['splash_style'],
                      }))
                    }
                    className="h-10 w-full rounded-md border bg-background px-3"
                  >
                    <option value="none">Sin animación</option>
                    <option value="reveal">Apertura premium</option>
                    {isIkon && <option value="golf">Animación golf (IKON)</option>}
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="hero_image_url">Imagen de portada</Label>
                  <Input
                    id="hero_image_url"
                    value={branding.hero_image_url}
                    onChange={(e) => setBranding((p) => ({ ...p, hero_image_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_eyebrow_kicker">Rótulo superior</Label>
                  <Input
                    id="hero_eyebrow_kicker"
                    value={branding.hero_eyebrow_kicker}
                    onChange={(e) => setBranding((p) => ({ ...p, hero_eyebrow_kicker: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_eyebrow">Rótulo secundario</Label>
                  <Input
                    id="hero_eyebrow"
                    value={branding.hero_eyebrow}
                    onChange={(e) => setBranding((p) => ({ ...p, hero_eyebrow: e.target.value }))}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="space-y-2">
                      <Label>Título línea {n}</Label>
                      <Input
                        value={branding[`hero_title_line_${n}` as keyof BrandingFormState] as string}
                        onChange={(e) =>
                          setBranding((p) => ({
                            ...p,
                            [`hero_title_line_${n}`]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="hero_title_mobile">Título móvil</Label>
                  <Input
                    id="hero_title_mobile"
                    value={branding.hero_title_mobile}
                    onChange={(e) => setBranding((p) => ({ ...p, hero_title_mobile: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="hero_tagline">Subtítulo / descripción</Label>
                  <Textarea
                    id="hero_tagline"
                    rows={2}
                    value={branding.hero_tagline}
                    onChange={(e) => setBranding((p) => ({ ...p, hero_tagline: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_highlights">Indicadores (coma)</Label>
                  <Input
                    id="hero_highlights"
                    value={branding.hero_highlights}
                    onChange={(e) => setBranding((p) => ({ ...p, hero_highlights: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_stats">Estadísticas (valor|etiqueta por línea)</Label>
                  <Textarea
                    id="hero_stats"
                    rows={4}
                    value={branding.hero_stats}
                    onChange={(e) => setBranding((p) => ({ ...p, hero_stats: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar identidad
            </Button>
          </div>
        </div>

        <BrandPreviewPanel branding={branding} slug={slug} className="hidden xl:block" />
      </div>

      <div className="xl:hidden">
        <BrandPreviewPanel branding={branding} slug={slug} />
      </div>
    </div>
  )
}
