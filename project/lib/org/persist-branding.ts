import type { SupabaseClient } from '@supabase/supabase-js'
import {
  applyBrandTemplate,
  brandingFormToExperience,
  getBrandTemplate,
  type BrandTemplateId,
  type BrandingFormState,
} from './brand-templates'

export type BrandingMeta = {
  template_id: BrandTemplateId
  applied_at: string
}

async function upsertOrgSetting(
  supabase: SupabaseClient,
  organizationId: string,
  key: string,
  value: Record<string, unknown>
) {
  const { data: existing } = await supabase
    .from('organization_settings')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('key', key)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('organization_settings')
      .update({ value: value as never, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('organization_settings').insert({
    organization_id: organizationId,
    key,
    value: value as never,
  })
  if (error) throw error
}

/** Persiste el formulario completo de marca en organizations + organization_settings. */
export async function persistBrandingForm(
  supabase: SupabaseClient,
  organizationId: string,
  form: BrandingFormState,
  options?: { templateId?: BrandTemplateId }
) {
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      name: form.name,
      logo_url: form.logo_url || null,
      favicon_url: form.favicon_url || null,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      accent_color: form.accent_color,
      font_family: form.font_family,
      theme_mode: form.theme_mode,
    } as never)
    .eq('id', organizationId)

  if (orgError) throw orgError

  await upsertOrgSetting(supabase, organizationId, 'branding_hero', {
    hero_image_url: form.hero_image_url || null,
    hero_tagline: form.hero_tagline || null,
  })

  await upsertOrgSetting(
    supabase,
    organizationId,
    'branding_experience',
    brandingFormToExperience(form) as unknown as Record<string, unknown>
  )

  if (options?.templateId) {
    await upsertOrgSetting(supabase, organizationId, 'branding_meta', {
      template_id: options.templateId,
      applied_at: new Date().toISOString(),
    })
  }
}

/** Aplica una plantilla premium a una organización recién creada (o reset de marca). */
export async function applyTemplateToOrganization(
  supabase: SupabaseClient,
  organizationId: string,
  templateId: BrandTemplateId,
  clubName: string,
  options?: { slug?: string }
) {
  const template = getBrandTemplate(templateId)
  if (!template) throw new Error('Plantilla no encontrada')

  const form = applyBrandTemplate(template, clubName)
  form.name = clubName

  if (options?.slug === 'ikon') {
    form.splash_style = 'golf'
  }

  await persistBrandingForm(supabase, organizationId, form, { templateId })
}

export function buildBrandingFormForTemplate(
  templateId: BrandTemplateId,
  clubName: string,
  slug?: string
): BrandingFormState {
  const template = getBrandTemplate(templateId)
  if (!template) throw new Error('Plantilla no encontrada')

  const form = applyBrandTemplate(template, clubName)
  form.name = clubName
  if (slug === 'ikon') form.splash_style = 'golf'
  return form
}
