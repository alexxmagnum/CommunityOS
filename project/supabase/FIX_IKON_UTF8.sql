-- Corrige textos IKON con caracteres rotos (mojibake) en organization_settings.
-- Ejecutar en Supabase SQL Editor después de SUPABASE_PEGAR_COMPLETO.sql

UPDATE organization_settings s
SET value = jsonb_build_object(
  'hero_style', 'cinematic',
  'splash_style', 'golf',
  'tagline', 'Sports & Lounge · Sant Jordi',
  'hero_eyebrow_kicker', 'Panorámica Golf',
  'hero_eyebrow', 'Golf · Sports · Lounge',
  'hero_title_lines', jsonb_build_array(
    'Un estilo', 'de vida.', 'Una pasión', 'eterna.'
  ),
  'hero_title_mobile', 'Un estilo de vida. Una pasión eterna.'
)
FROM organizations o
WHERE s.organization_id = o.id
  AND o.slug = 'ikon'
  AND s.key = 'branding_experience';

UPDATE organization_settings s
SET value = jsonb_build_object(
  'hero_tagline', 'Descubre un lugar mágico donde el deporte, la naturaleza y la exclusividad crean una experiencia única.',
  'hero_image_url', COALESCE(s.value->>'hero_image_url', null)
)
FROM organizations o
WHERE s.organization_id = o.id
  AND o.slug = 'ikon'
  AND s.key = 'branding_hero';
