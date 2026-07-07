-- Fix critical RLS gaps and auto-create profiles on signup

-- ============================================================================
-- PROFILES: auto-create on signup + allow insert own
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PLATFORM_ADMINS: allow users to read their own admin record
-- ============================================================================

DROP POLICY IF EXISTS "platform_admins_read_own" ON platform_admins;
CREATE POLICY "platform_admins_read_own" ON platform_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- ROLES: readable by all authenticated users (needed for joins & admin checks)
-- ============================================================================

DROP POLICY IF EXISTS "roles_read_authenticated" ON roles;
CREATE POLICY "roles_read_authenticated" ON roles FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- ORGANIZATIONS: org admins can update their org (branding)
-- ============================================================================

DROP POLICY IF EXISTS "org_admins_update" ON organizations;
CREATE POLICY "org_admins_update" ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- ORGANIZATION_MEMBERS: restrict self-join to pending invitations only
-- ============================================================================

DROP POLICY IF EXISTS "users_join_org" ON organization_members;
CREATE POLICY "users_join_org" ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- ============================================================================
-- EVENTS: allow anonymous/public read of published public events
-- ============================================================================

DROP POLICY IF EXISTS "events_public_read" ON events;
CREATE POLICY "events_public_read" ON events FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND is_public = true
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "organizations_public_read" ON organizations;
CREATE POLICY "organizations_public_read" ON organizations FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
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
-- IKON â€” first customer seed
-- ============================================================================

INSERT INTO organizations (
  name, slug, primary_color, secondary_color, accent_color,
  subscription_tier, modules, is_active
) VALUES (
  'IKON',
  'ikon',
  '#1a1a2e',
  '#16213e',
  '#c9a962',
  'professional',
  '{"restaurant": true, "sports": true, "events": true, "tournaments": true}'::jsonb,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  accent_color = EXCLUDED.accent_color,
  modules = EXCLUDED.modules;

-- Venue
INSERT INTO venues (organization_id, name, description, type, city, country, is_active)
SELECT o.id, 'IKON Main Campus', 'Golf, padel, dining and events', 'main', 'Marbella', 'Spain', true
FROM organizations o WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM venues v WHERE v.organization_id = o.id AND v.name = 'IKON Main Campus'
);

-- Restaurant
INSERT INTO restaurants (organization_id, name, description, cuisine_type, is_active)
SELECT o.id, 'IKON Terrace', 'Mediterranean dining with live music', 'Mediterranean', true
FROM organizations o WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM restaurants r WHERE r.organization_id = o.id AND r.name = 'IKON Terrace'
);

-- Menu categories
INSERT INTO menu_categories (organization_id, restaurant_id, name, sort_order, is_active)
SELECT o.id, r.id, cat.name, cat.sort_order, true
FROM organizations o
JOIN restaurants r ON r.organization_id = o.id AND r.name = 'IKON Terrace'
CROSS JOIN (VALUES ('Starters', 1), ('Mains', 2), ('Desserts', 3), ('Drinks', 4)) AS cat(name, sort_order)
WHERE o.slug = 'ikon'
ON CONFLICT DO NOTHING;

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

  SELECT id INTO cat_starters FROM menu_categories WHERE organization_id = org_uuid AND name = 'Starters' LIMIT 1;
  SELECT id INTO cat_mains FROM menu_categories WHERE organization_id = org_uuid AND name = 'Mains' LIMIT 1;
  SELECT id INTO cat_desserts FROM menu_categories WHERE organization_id = org_uuid AND name = 'Desserts' LIMIT 1;
  SELECT id INTO cat_drinks FROM menu_categories WHERE organization_id = org_uuid AND name = 'Drinks' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE organization_id = org_uuid AND name = 'Gambas al ajillo') THEN
    INSERT INTO dishes (organization_id, category_id, name, description, price, is_available)
    VALUES
      (org_uuid, cat_starters, 'Gambas al ajillo', 'Fresh prawns in garlic oil', 14.50, true),
      (org_uuid, cat_starters, 'Burrata salad', 'With heirloom tomatoes', 12.00, true),
      (org_uuid, cat_mains, 'Grilled sea bass', 'With seasonal vegetables', 26.00, true),
      (org_uuid, cat_mains, 'IKON burger', 'Wagyu beef, truffle mayo', 22.00, true),
      (org_uuid, cat_desserts, 'Tiramisu', 'Classic recipe', 9.00, true),
      (org_uuid, cat_drinks, 'House wine glass', 'Red or white', 6.50, true);
  END IF;
END $$;

-- Facilities (sports)
INSERT INTO facilities (organization_id, sport_id, name, description, type, is_active, booking_config)
SELECT o.id, s.id, f.name, f.description, f.type, true,
  jsonb_build_object('duration_minutes', 60, 'price_per_hour', f.price)
FROM organizations o
CROSS JOIN (VALUES
  ('padel', 'Padel Court 1', 'Glass court with LED lighting', 'outdoor', 35),
  ('padel', 'Padel Court 2', 'Premium WPT standard', 'outdoor', 35),
  ('padel', 'Padel Court 3', 'Covered court', 'covered', 40),
  ('golf', 'Golf Course', '18-hole championship course', 'outdoor', 80),
  ('tennis', 'Tennis Court 1', 'Clay surface', 'outdoor', 30)
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
  ('Wine Tasting Evening', 'Exclusive tasting with sommelier', 'experience',
   '2026-07-12 19:00:00+00', '2026-07-12 22:00:00+00', 20, 8, 45, 'Main Terrace'),
  ('Padel Tournament Finals', 'Season finale â€” members welcome', 'tournament',
   '2026-07-14 10:00:00+00', '2026-07-14 18:00:00+00', 32, 0, 0, 'Padel Courts'),
  ('Sunday Brunch', 'Live jazz and Mediterranean buffet', 'event',
   '2026-07-13 11:00:00+00', '2026-07-13 15:00:00+00', 40, 24, 35, 'IKON Terrace'),
  ('Sunset Yoga', 'Outdoor session overlooking the course', 'workshop',
   '2026-07-11 18:30:00+00', '2026-07-11 20:00:00+00', 15, 12, 15, 'Garden Lawn')
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
  ('event_join', 'Alex joined Padel Tournament', 'Registered for the season finale'),
  ('reservation', 'Sarah reserved Wine Tasting', 'Party of 2 confirmed'),
  ('tournament_win', 'Mike won Golf Competition', 'Stableford format â€” 38 points'),
  ('reservation', 'Emma booked Terrace table', 'Table for 4 â€” Sunday Brunch')
) AS a(type, title, description)
WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM activity_feed af
  WHERE af.organization_id = o.id AND af.title = a.title
);
