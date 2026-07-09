-- IKON seed data, reservations trigger, activity public read, event registration

-- Reservation reference code on insert
CREATE OR REPLACE FUNCTION public.set_reservation_reference_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_code IS NULL OR NEW.reference_code = '' THEN
    NEW.reference_code := generate_reservation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reservations_set_code ON reservations;
CREATE TRIGGER reservations_set_code
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_reservation_reference_code();

-- Public activity feed for active orgs
DROP POLICY IF EXISTS "activity_feed_public_read" ON activity_feed;
CREATE POLICY "activity_feed_public_read" ON activity_feed FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Members can register for events
DROP POLICY IF EXISTS "event_participants_update_own" ON event_participants;
CREATE POLICY "event_participants_update_own" ON event_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Members create own reservations
DROP POLICY IF EXISTS "reservations_update_own" ON reservations;
CREATE POLICY "reservations_update_own" ON reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anon can read facilities for public orgs (availability display)
DROP POLICY IF EXISTS "facilities_public_read" ON facilities;
CREATE POLICY "facilities_public_read" ON facilities FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

-- ============================================================================
-- IKON — first customer seed
-- ============================================================================

INSERT INTO organizations (
  name, slug, primary_color, secondary_color, accent_color,
  subscription_tier, modules, is_active
) VALUES (
  'IKON',
  'ikon',
  '#0A0A0A',
  '#141414',
  '#32E4B5',
  'professional',
  '{"restaurant": true, "sports": true, "events": true, "tournaments": true}'::jsonb,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  accent_color = EXCLUDED.accent_color,
  modules = EXCLUDED.modules;

-- Venue
INSERT INTO venues (organization_id, name, description, type, city, country, is_active)
SELECT o.id, 'Campus principal IKON', 'Golf, pádel, restaurante y eventos', 'main', 'Marbella', 'España', true
FROM organizations o WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM venues v WHERE v.organization_id = o.id AND v.name IN ('IKON Main Campus', 'Campus principal IKON')
);

-- Restaurant
INSERT INTO restaurants (organization_id, name, description, cuisine_type, is_active)
SELECT o.id, 'IKON Terrace', 'Gastronomía mediterránea con música en vivo', 'Mediterránea', true
FROM organizations o WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM restaurants r WHERE r.organization_id = o.id AND r.name = 'IKON Terrace'
);

-- Menu categories
INSERT INTO menu_categories (organization_id, restaurant_id, name, sort_order, is_active)
SELECT o.id, r.id, cat.name, cat.sort_order, true
FROM organizations o
JOIN restaurants r ON r.organization_id = o.id AND r.name = 'IKON Terrace'
CROSS JOIN (VALUES ('Entrantes', 1), ('Principales', 2), ('Postres', 3), ('Bebidas', 4)) AS cat(name, sort_order)
WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM menu_categories mc
  WHERE mc.organization_id = o.id AND mc.name = cat.name
);

-- Sample dishes (skip if already seeded)
DO $$
DECLARE
  org_uuid uuid;
  cat_starters uuid;
  cat_mains uuid;
  cat_desserts uuid;
  cat_drinks uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  SELECT id INTO cat_starters FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Entrantes', 'Starters') ORDER BY CASE WHEN name = 'Entrantes' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_mains FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Principales', 'Mains') ORDER BY CASE WHEN name = 'Principales' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_desserts FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Postres', 'Desserts') ORDER BY CASE WHEN name = 'Postres' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_drinks FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Bebidas', 'Drinks') ORDER BY CASE WHEN name = 'Bebidas' THEN 0 ELSE 1 END LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE organization_id = org_uuid AND name = 'Gambas al ajillo') THEN
    INSERT INTO dishes (organization_id, category_id, name, description, price, is_available)
    VALUES
      (org_uuid, cat_starters, 'Gambas al ajillo', 'Gambas frescas en aceite de ajo', 14.50, true),
      (org_uuid, cat_starters, 'Ensalada de burrata', 'Tomates heirloom, albahaca y aceite de oliva virgen', 12.00, true),
      (org_uuid, cat_mains, 'Lubina a la brasa', 'Verduras de temporada y emulsión cítrica', 26.00, true),
      (org_uuid, cat_mains, 'Burger IKON', 'Wagyu, mayo de trufa y pan brioche', 22.00, true),
      (org_uuid, cat_desserts, 'Tiramisú', 'Receta clásica de la casa', 9.00, true),
      (org_uuid, cat_drinks, 'Copa de vino de la casa', 'Tinto o blanco', 6.50, true);
  END IF;
END $$;

-- Facilities (sports)
INSERT INTO facilities (organization_id, sport_id, name, description, type, is_active, booking_config)
SELECT o.id, s.id, f.name, f.description, f.type, true,
  jsonb_build_object('duration_minutes', 60, 'price_per_hour', f.price)
FROM organizations o
CROSS JOIN (VALUES
  ('padel', 'Pista de pádel 1', 'Pista acristalada con iluminación LED', 'outdoor', 35),
  ('padel', 'Pista de pádel 2', 'Estándar WPT premium', 'outdoor', 35),
  ('padel', 'Pista de pádel 3', 'Pista cubierta', 'covered', 40),
  ('golf', 'Campo de golf', 'Campo championship de 18 hoyos', 'outdoor', 80),
  ('tennis', 'Pista de tenis 1', 'Pista de tierra batida', 'outdoor', 30)
) AS f(sport, name, description, type, price)
JOIN sports s ON s.name = f.sport
WHERE o.slug = 'ikon'
AND NOT EXISTS (SELECT 1 FROM facilities fa WHERE fa.organization_id = o.id AND fa.name = f.name);

-- Sample published events
INSERT INTO events (
  organization_id, title, description, type, starts_at, ends_at,
  capacity, available_spots, price, status, is_public, location_details
)
SELECT o.id, e.title, e.description, e.type, e.starts_at::timestamptz, e.ends_at::timestamptz,
  e.capacity, e.available_spots, e.price, 'published', true, e.location
FROM organizations o
CROSS JOIN (VALUES
  ('Cata de vinos en la terraza', 'Cata exclusiva con sumiller', 'experience',
   '2026-07-12 19:00:00+00', '2026-07-12 22:00:00+00', 20, 8, 45, 'Terraza principal'),
  ('Final del torneo de pádel', 'Final de temporada — socios bienvenidos', 'tournament',
   '2026-07-14 10:00:00+00', '2026-07-14 18:00:00+00', 32, 0, 0, 'Pistas de pádel'),
  ('Brunch dominical', 'Jazz en vivo y buffet mediterráneo', 'event',
   '2026-07-13 11:00:00+00', '2026-07-13 15:00:00+00', 40, 24, 35, 'Terraza IKON'),
  ('Yoga al atardecer', 'Sesión al aire libre con vistas al campo', 'workshop',
   '2026-07-11 18:30:00+00', '2026-07-11 20:00:00+00', 15, 12, 15, 'Jardín del club')
) AS e(title, description, type, starts_at, ends_at, capacity, available_spots, price, location)
WHERE o.slug = 'ikon'
AND NOT EXISTS (SELECT 1 FROM events ev WHERE ev.organization_id = o.id AND ev.title = e.title);

DROP POLICY IF EXISTS "platform_admins_members" ON organization_members;
CREATE POLICY "platform_admins_members" ON organization_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Platform admins can read all profiles
DROP POLICY IF EXISTS "platform_admins_profiles_all" ON profiles;
CREATE POLICY "platform_admins_profiles_all" ON profiles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Sample activity feed
INSERT INTO activity_feed (organization_id, activity_type, title, description, is_public)
SELECT o.id, a.type, a.title, a.description, true
FROM organizations o
CROSS JOIN (VALUES
  ('event_join', 'Alex se inscribió al torneo de pádel', 'Inscrito en la final de temporada'),
  ('reservation', 'Sarah reservó cata de vinos', 'Mesa para 2 confirmada'),
  ('tournament_win', 'Mike ganó la competición de golf', 'Formato stableford — 38 puntos'),
  ('reservation', 'Emma reservó mesa en terraza', 'Mesa para 4 — brunch dominical')
) AS a(type, title, description)
WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM activity_feed af
  WHERE af.organization_id = o.id AND af.title = a.title
);
