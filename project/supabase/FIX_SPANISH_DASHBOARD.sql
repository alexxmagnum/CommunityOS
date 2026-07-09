-- Canónico: supabase/seeds/ikon_demo_es.sql (mismo contenido)
-- Ejecutar UNA vez en Supabase SQL Editor

-- =============================================================================
-- IKON demo en español — corrige seed legacy en inglés + datos de sistema
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE roles SET display_name = 'Propietario del club', description = 'Acceso total a la organización'
WHERE name = 'org_owner' AND display_name ILIKE '%owner%';

UPDATE roles SET display_name = 'Administrador del club', description = 'Acceso administrativo'
WHERE name = 'org_admin' AND display_name ILIKE '%admin%';

UPDATE roles SET display_name = 'Miembro', description = 'Acceso estándar de socio'
WHERE name = 'org_member' AND (display_name = 'Member' OR display_name ILIKE '%member%');

UPDATE sports SET display_name = 'Pádel' WHERE name = 'padel';
UPDATE sports SET display_name = 'Tenis' WHERE name = 'tennis';
UPDATE sports SET display_name = 'Fútbol' WHERE name = 'football';
UPDATE sports SET display_name = 'Billar' WHERE name = 'billiards';

DO $$
DECLARE
  org_uuid uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  UPDATE venues SET
    name = 'Campus principal IKON',
    description = 'Golf, pádel, restaurante y eventos',
    country = 'España'
  WHERE organization_id = org_uuid AND name = 'IKON Main Campus';

  UPDATE restaurants SET
    description = 'Gastronomía mediterránea con música en vivo',
    cuisine_type = 'Mediterránea'
  WHERE organization_id = org_uuid AND name = 'IKON Terrace';

  UPDATE menu_categories SET name = 'Entrantes' WHERE organization_id = org_uuid AND name = 'Starters';
  UPDATE menu_categories SET name = 'Principales' WHERE organization_id = org_uuid AND name = 'Mains';
  UPDATE menu_categories SET name = 'Postres' WHERE organization_id = org_uuid AND name = 'Desserts';
  UPDATE menu_categories SET name = 'Bebidas' WHERE organization_id = org_uuid AND name = 'Drinks';

  WITH ranked AS (
    SELECT
      id,
      FIRST_VALUE(id) OVER (PARTITION BY organization_id, name ORDER BY created_at) AS keeper_id,
      ROW_NUMBER() OVER (PARTITION BY organization_id, name ORDER BY created_at) AS rn
    FROM menu_categories
    WHERE organization_id = org_uuid
  )
  UPDATE dishes d SET category_id = r.keeper_id
  FROM ranked r WHERE d.category_id = r.id AND r.rn > 1;

  DELETE FROM menu_categories mc
  USING (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id, name ORDER BY created_at) AS rn
    FROM menu_categories WHERE organization_id = org_uuid
  ) dup
  WHERE mc.id = dup.id AND dup.rn > 1;

  UPDATE dishes SET description = 'Gambas frescas en aceite de ajo'
  WHERE organization_id = org_uuid AND name = 'Gambas al ajillo';

  UPDATE dishes SET name = 'Ensalada de burrata', description = 'Tomates heirloom, albahaca y aceite de oliva virgen'
  WHERE organization_id = org_uuid AND name = 'Burrata salad';

  UPDATE dishes SET name = 'Lubina a la brasa', description = 'Verduras de temporada y emulsión cítrica'
  WHERE organization_id = org_uuid AND name = 'Grilled sea bass';

  UPDATE dishes SET name = 'Burger IKON', description = 'Wagyu, mayo de trufa y pan brioche'
  WHERE organization_id = org_uuid AND name = 'IKON burger';

  UPDATE dishes SET name = 'Tiramisú', description = 'Receta clásica de la casa'
  WHERE organization_id = org_uuid AND name IN ('Tiramisu', 'Tiramisú');

  UPDATE dishes SET name = 'Copa de vino de la casa', description = 'Tinto o blanco'
  WHERE organization_id = org_uuid AND name = 'House wine glass';

  UPDATE facilities SET name = 'Pista de pádel 1', description = 'Pista acristalada con iluminación LED'
  WHERE organization_id = org_uuid AND name = 'Padel Court 1';

  UPDATE facilities SET name = 'Pista de pádel 2', description = 'Estándar WPT premium'
  WHERE organization_id = org_uuid AND name = 'Padel Court 2';

  UPDATE facilities SET name = 'Pista de pádel 3', description = 'Pista cubierta'
  WHERE organization_id = org_uuid AND name = 'Padel Court 3';

  UPDATE facilities SET name = 'Campo de golf', description = 'Campo championship de 18 hoyos'
  WHERE organization_id = org_uuid AND name = 'Golf Course';

  UPDATE facilities SET name = 'Pista de tenis 1', description = 'Pista de tierra batida'
  WHERE organization_id = org_uuid AND name = 'Tennis Court 1';

  UPDATE events SET
    title = 'Cata de vinos en la terraza',
    description = 'Cata exclusiva con sumiller',
    location_details = 'Terraza principal'
  WHERE organization_id = org_uuid AND title = 'Wine Tasting Evening';

  UPDATE events SET
    title = 'Final del torneo de pádel',
    description = 'Final de temporada — socios bienvenidos',
    location_details = 'Pistas de pádel'
  WHERE organization_id = org_uuid AND title = 'Padel Tournament Finals';

  UPDATE events SET
    title = 'Brunch dominical',
    description = 'Jazz en vivo y buffet mediterráneo',
    location_details = 'Terraza IKON'
  WHERE organization_id = org_uuid AND title = 'Sunday Brunch';

  UPDATE events SET
    title = 'Yoga al atardecer',
    description = 'Sesión al aire libre con vistas al campo',
    location_details = 'Jardín del club'
  WHERE organization_id = org_uuid AND title = 'Sunset Yoga';

  UPDATE activity_feed SET title = 'Alex se inscribió al torneo de pádel', description = 'Inscrito en la final de temporada'
  WHERE organization_id = org_uuid AND title = 'Alex joined Padel Tournament';

  UPDATE activity_feed SET title = 'Sarah reservó cata de vinos', description = 'Mesa para 2 confirmada'
  WHERE organization_id = org_uuid AND title = 'Sarah reserved Wine Tasting';

  UPDATE activity_feed SET title = 'Mike ganó la competición de golf', description = 'Formato stableford — 38 puntos'
  WHERE organization_id = org_uuid AND title = 'Mike won Golf Competition';

  UPDATE activity_feed SET title = 'Emma reservó mesa en terraza', description = 'Mesa para 4 — brunch dominical'
  WHERE organization_id = org_uuid AND title = 'Emma booked Terrace table';
END $$;
