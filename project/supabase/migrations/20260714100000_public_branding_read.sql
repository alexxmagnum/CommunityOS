-- Lectura pública de branding (hero/splash) para visitantes anónimos en la app miembro.

DROP POLICY IF EXISTS "public_branding_settings_read" ON organization_settings;

CREATE POLICY "public_branding_settings_read"
ON organization_settings
FOR SELECT
TO anon, authenticated
USING (
  key IN ('branding_hero', 'branding_experience', 'branding_meta')
  AND EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = organization_settings.organization_id
      AND o.is_active = true
  )
);
