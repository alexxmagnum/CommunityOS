-- IKON branding assets in DB (white-label: logo from organizations, not hardcoded)

UPDATE organizations
SET
  logo_url = COALESCE(NULLIF(logo_url, ''), '/brand/ikon-logo.png'),
  favicon_url = COALESCE(NULLIF(favicon_url, ''), '/brand/ikon-logo.png')
WHERE slug = 'ikon';
