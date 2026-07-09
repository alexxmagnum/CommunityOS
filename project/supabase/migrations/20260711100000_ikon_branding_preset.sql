-- Preset de experiencia visual para IKON (cliente demo / primer tenant)
-- Otros clubs configuran esto desde Panel → Marca.

INSERT INTO organization_settings (organization_id, key, value)
SELECT
  o.id,
  'branding_experience',
  jsonb_build_object(
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
WHERE o.slug = 'ikon'
  AND NOT EXISTS (
    SELECT 1 FROM organization_settings s
    WHERE s.organization_id = o.id AND s.key = 'branding_experience'
  );

INSERT INTO organization_settings (organization_id, key, value)
SELECT
  o.id,
  'branding_hero',
  jsonb_build_object(
    'hero_tagline', 'Descubre un lugar mágico donde el deporte, la naturaleza y la exclusividad crean una experiencia única.',
    'hero_image_url', null
  )
FROM organizations o
WHERE o.slug = 'ikon'
  AND NOT EXISTS (
    SELECT 1 FROM organization_settings s
    WHERE s.organization_id = o.id AND s.key = 'branding_hero'
  );
