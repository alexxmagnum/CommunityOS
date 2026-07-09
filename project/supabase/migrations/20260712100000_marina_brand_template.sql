-- Marina Beach Club — segundo tenant real con plantilla Coastal Premium
-- Ejecutar después de APPLY_ALL.sql (requiere esquema base).

INSERT INTO organizations (
  name, slug, primary_color, secondary_color, accent_color,
  font_family, theme_mode, is_active, subscription_tier, modules
)
SELECT
  'Marina Beach Club',
  'marina',
  '#050C12',
  '#0A1620',
  '#3FE0D4',
  'Playfair Display',
  'dark',
  true,
  'professional',
  '{"restaurant": true, "sports": true, "events": true, "tournaments": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'marina');

UPDATE organizations SET
  primary_color = '#050C12',
  secondary_color = '#0A1620',
  accent_color = '#3FE0D4',
  font_family = 'Playfair Display',
  theme_mode = 'dark'
WHERE slug = 'marina';

INSERT INTO organization_settings (organization_id, key, value)
SELECT o.id, 'branding_experience', jsonb_build_object(
  'hero_style', 'cinematic',
  'splash_style', 'reveal',
  'tagline', 'Beach Club · Mediterráneo',
  'hero_eyebrow_kicker', 'Frente al mar',
  'hero_eyebrow', 'Playa · Deporte · Gastronomía',
  'hero_title_lines', jsonb_build_array('Vive el', 'Mediterráneo.', 'Sin', 'límites.'),
  'hero_title_mobile', 'Vive el Mediterráneo sin límites.',
  'hero_highlights', jsonb_build_array('Hamacas VIP', 'Paddle', 'Regatas', 'Restaurante', 'Spa'),
  'hero_stats', jsonb_build_array(
    jsonb_build_object('value', '200+', 'label', 'Socios'),
    jsonb_build_object('value', '8', 'label', 'Pistas'),
    jsonb_build_object('value', '12', 'label', 'Meses temporada'),
    jsonb_build_object('value', '5★', 'label', 'Experiencia')
  )
)
FROM organizations o
WHERE o.slug = 'marina'
  AND NOT EXISTS (
    SELECT 1 FROM organization_settings s
    WHERE s.organization_id = o.id AND s.key = 'branding_experience'
  );

INSERT INTO organization_settings (organization_id, key, value)
SELECT o.id, 'branding_hero', jsonb_build_object(
  'hero_tagline', 'Sol, mar y experiencias exclusivas en un club diseñado para disfrutar cada momento.',
  'hero_image_url', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80'
)
FROM organizations o
WHERE o.slug = 'marina'
  AND NOT EXISTS (
    SELECT 1 FROM organization_settings s
    WHERE s.organization_id = o.id AND s.key = 'branding_hero'
  );

INSERT INTO organization_settings (organization_id, key, value)
SELECT o.id, 'branding_meta', jsonb_build_object(
  'template_id', 'coastal',
  'applied_at', now()
)
FROM organizations o
WHERE o.slug = 'marina'
  AND NOT EXISTS (
    SELECT 1 FROM organization_settings s
    WHERE s.organization_id = o.id AND s.key = 'branding_meta'
  );
