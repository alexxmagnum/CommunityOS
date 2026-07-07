-- Carta digital: lectura pública de menú para organizaciones activas

DROP POLICY IF EXISTS "menu_categories_public_read" ON menu_categories;
CREATE POLICY "menu_categories_public_read" ON menu_categories FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "dishes_public_read" ON dishes;
CREATE POLICY "dishes_public_read" ON dishes FOR SELECT
  TO anon, authenticated
  USING (
    is_available = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "restaurants_public_read" ON restaurants;
CREATE POLICY "restaurants_public_read" ON restaurants FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );
