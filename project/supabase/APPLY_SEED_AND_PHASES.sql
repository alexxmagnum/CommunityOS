-- Community OS — Seed IKON + migraciones fase 1 a 4
-- Ejecutar DESPUES de APPLY_ALL.sql (o si ya tienes el esquema base).
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
  '#0A0A0A',
  '#141414',
  '#32E4B5',
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
 -- Carta digital: lectura pÃºblica de menÃº para organizaciones activas

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
 -- Phase 1: availability engine, notifications, invitations, conflict prevention

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  payload jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = notifications.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- ORGANIZATION INVITATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email
  ON organization_invitations(organization_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_token ON organization_invitations(token);

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_read_org_admin" ON organization_invitations;
CREATE POLICY "invitations_read_org_admin" ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR (status = 'pending' AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

DROP POLICY IF EXISTS "invitations_write_org_admin" ON organization_invitations;
CREATE POLICY "invitations_write_org_admin" ON organization_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = organization_invitations.organization_id
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
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "invitations_accept_own" ON organization_invitations;
CREATE POLICY "invitations_accept_own" ON organization_invitations FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND expires_at > now()
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    status IN ('accepted', 'revoked')
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Public invitation preview (token only, no sensitive data leak)
CREATE OR REPLACE FUNCTION public.get_invitation_public(p_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'email', i.email,
    'status', i.status,
    'organization', jsonb_build_object('name', o.name, 'slug', o.slug)
  )
  FROM organization_invitations i
  JOIN organizations o ON o.id = i.organization_id
  WHERE i.token = p_token
    AND i.status = 'pending'
    AND i.expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_public(text) TO anon, authenticated;

-- ============================================================================
-- RESERVATION CONFLICT PREVENTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reservation_duration_minutes(p_start timestamptz, p_end timestamptz)
RETURNS interval AS $$
BEGIN
  RETURN COALESCE(p_end, p_start + interval '60 minutes') - p_start;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.check_reservation_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_exists boolean;
BEGIN
  IF NEW.status NOT IN ('pending', 'confirmed') OR NEW.start_time IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM reservations r
    WHERE r.organization_id = NEW.organization_id
      AND r.id IS DISTINCT FROM NEW.id
      AND r.status IN ('pending', 'confirmed')
      AND r.start_time IS NOT NULL
      AND (
        (NEW.facility_id IS NOT NULL AND r.facility_id = NEW.facility_id)
        OR (NEW.space_id IS NOT NULL AND r.space_id = NEW.space_id)
        OR (
          NEW.restaurant_id IS NOT NULL
          AND r.restaurant_id = NEW.restaurant_id
          AND COALESCE(NEW.space_id, '00000000-0000-0000-0000-000000000000'::uuid)
            = COALESCE(r.space_id, '00000000-0000-0000-0000-000000000000'::uuid)
        )
      )
      AND tstzrange(
        NEW.start_time,
        COALESCE(NEW.end_time, NEW.start_time + interval '60 minutes'),
        '[)'
      ) && tstzrange(
        r.start_time,
        COALESCE(r.end_time, r.start_time + interval '60 minutes'),
        '[)'
      )
  ) INTO conflict_exists;

  IF conflict_exists THEN
    RAISE EXCEPTION 'Este horario ya no estÃ¡ disponible';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reservation_conflict ON reservations;
CREATE TRIGGER trg_check_reservation_conflict
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION public.check_reservation_conflict();

-- ============================================================================
-- DEFAULT BOOKING HOURS ON IKON FACILITIES
-- ============================================================================

UPDATE facilities f
SET booking_config = COALESCE(f.booking_config, '{}'::jsonb) || jsonb_build_object(
  'open_hour', 8,
  'close_hour', 22,
  'slot_interval_minutes', 60,
  'max_advance_days', 30
)
FROM organizations o
WHERE f.organization_id = o.id
  AND o.slug = 'ikon'
  AND NOT (f.booking_config ? 'open_hour');

UPDATE restaurants r
SET reservation_config = COALESCE(r.reservation_config, '{}'::jsonb) || jsonb_build_object(
  'open_hour', 12,
  'close_hour', 23,
  'slot_interval_minutes', 30,
  'duration_minutes', 90,
  'max_advance_days', 30
)
FROM organizations o
WHERE r.organization_id = o.id
  AND o.slug = 'ikon'
  AND NOT (r.reservation_config ? 'open_hour');

-- IKON restaurant spaces (terrace / main room)
DO $$
DECLARE
  org_uuid uuid;
  venue_uuid uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  SELECT id INTO venue_uuid FROM venues WHERE organization_id = org_uuid LIMIT 1;

  IF venue_uuid IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM spaces WHERE organization_id = org_uuid AND name = 'Terraza IKON'
  ) THEN
    INSERT INTO spaces (organization_id, venue_id, name, description, type, capacity, is_bookable, booking_config)
    VALUES
      (org_uuid, venue_uuid, 'Terraza IKON', 'Mesas con vistas al campo', 'terrace', 40, true,
        '{"open_hour": 12, "close_hour": 23, "slot_interval_minutes": 30, "duration_minutes": 90}'::jsonb),
      (org_uuid, venue_uuid, 'Sala principal', 'Comedor interior', 'restaurant', 30, true,
        '{"open_hour": 12, "close_hour": 23, "slot_interval_minutes": 30, "duration_minutes": 90}'::jsonb);
  END IF;
END $$;

-- Public read spaces for active orgs (member booking)
DROP POLICY IF EXISTS "spaces_public_read_active_orgs" ON spaces;
CREATE POLICY "spaces_public_read_active_orgs" ON spaces FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND is_bookable = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

-- Org admins read all org reservations
DROP POLICY IF EXISTS "reservations_read_org_admin" ON reservations;
CREATE POLICY "reservations_read_org_admin" ON reservations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  );

-- ============================================================================
-- STORAGE: media bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_org_upload" ON storage.objects;
CREATE POLICY "media_org_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  );

DROP POLICY IF EXISTS "media_org_delete" ON storage.objects;
CREATE POLICY "media_org_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  );
 -- IKON branding assets in DB (white-label: logo from organizations, not hardcoded)

UPDATE organizations
SET
  logo_url = COALESCE(NULLIF(logo_url, ''), '/brand/ikon-logo.png'),
  favicon_url = COALESCE(NULLIF(favicon_url, ''), '/brand/ikon-logo.png')
WHERE slug = 'ikon';
 -- Phase 2: tournaments public access, event waitlist, check-in tokens, achievements seed

-- ============================================================================
-- EVENT WAITLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'confirmed', 'cancelled')),
  position integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_waitlist_event ON event_waitlist(event_id, position);

ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_read_own" ON event_waitlist;
CREATE POLICY "waitlist_read_own" ON event_waitlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "waitlist_insert_own" ON event_waitlist;
CREATE POLICY "waitlist_insert_own" ON event_waitlist FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "waitlist_admin" ON event_waitlist;
CREATE POLICY "waitlist_admin" ON event_waitlist FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid() AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  );

-- ============================================================================
-- CHECK-IN TOKEN ON EVENT PARTICIPANTS
-- ============================================================================

ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS check_in_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

CREATE OR REPLACE FUNCTION public.set_event_participant_check_in_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_in_token IS NULL OR NEW.check_in_token = '' THEN
    NEW.check_in_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_participant_check_in_token ON event_participants;
CREATE TRIGGER trg_event_participant_check_in_token
  BEFORE INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_event_participant_check_in_token();

-- ============================================================================
-- PUBLIC TOURNAMENT READ (published events)
-- ============================================================================

DROP POLICY IF EXISTS "tournaments_public_read" ON tournaments;
CREATE POLICY "tournaments_public_read" ON tournaments FOR SELECT
  TO anon, authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE is_active = true)
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = tournaments.event_id
      AND e.status = 'published'
      AND e.is_public = true
    )
  );

DROP POLICY IF EXISTS "matches_public_read" ON matches;
CREATE POLICY "matches_public_read" ON matches FOR SELECT
  TO anon, authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "tournament_participants_public_read" ON tournament_participants;
CREATE POLICY "tournament_participants_public_read" ON tournament_participants FOR SELECT
  TO anon, authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "rankings_public_read" ON rankings;
CREATE POLICY "rankings_public_read" ON rankings FOR SELECT
  TO anon, authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

-- ============================================================================
-- ACHIEVEMENTS SEED (IKON)
-- ============================================================================

DO $$
DECLARE
  org_uuid uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  INSERT INTO achievements (organization_id, name, display_name, description, icon, criteria, points)
  SELECT org_uuid, a.name, a.display_name, a.description, a.icon, a.criteria::jsonb, a.points
  FROM (VALUES
    ('first_event', 'Primera experiencia', 'Te apuntaste a tu primer evento', 'star', '{"type":"event_join","count":1}', 10),
    ('first_reservation', 'Primera reserva', 'Reservaste instalaciÃ³n o mesa', 'calendar', '{"type":"reservation","count":1}', 10),
    ('tournament_player', 'Competidor', 'Participaste en un torneo', 'trophy', '{"type":"tournament","count":1}', 25),
    ('regular_member', 'Socio activo', '5 participaciones en el club', 'users', '{"type":"participation","count":5}', 50)
  ) AS a(name, display_name, description, icon, criteria, points)
  WHERE NOT EXISTS (
    SELECT 1 FROM achievements ac WHERE ac.organization_id = org_uuid AND ac.name = a.name
  );
END $$;

-- ============================================================================
-- IKON PADEL TOURNAMENT SEED (linked to Padel Tournament Finals event)
-- ============================================================================

DO $$
DECLARE
  org_uuid uuid;
  event_uuid uuid;
  sport_uuid uuid;
  tournament_uuid uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  SELECT id INTO event_uuid FROM events
  WHERE organization_id = org_uuid AND title = 'Padel Tournament Finals' LIMIT 1;

  SELECT id INTO sport_uuid FROM sports WHERE name = 'padel' LIMIT 1;

  IF event_uuid IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM tournaments WHERE organization_id = org_uuid AND event_id = event_uuid) THEN
    INSERT INTO tournaments (organization_id, event_id, sport_id, format, max_teams, status)
    VALUES (org_uuid, event_uuid, sport_uuid, 'single_elimination', 8, 'in_progress')
    RETURNING id INTO tournament_uuid;
  ELSE
    SELECT id INTO tournament_uuid FROM tournaments WHERE event_id = event_uuid LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tournament_participants WHERE tournament_id = tournament_uuid) THEN
    INSERT INTO tournament_participants (organization_id, tournament_id, team_name, seed, status)
    VALUES
      (org_uuid, tournament_uuid, 'Equipo GarcÃ­a', 1, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo LÃ³pez', 2, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo MartÃ­n', 3, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Ruiz', 4, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Soto', 5, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Vega', 6, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Costa', 7, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo NÃºÃ±ez', 8, 'registered');
  END IF;
END $$;
 -- Fase 3: escala SaaS â€” analytics, friendships (future), Ã­ndices dominio

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_org_created
  ON analytics_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name
  ON analytics_events (event_name, created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admins_analytics_read" ON analytics_events;
CREATE POLICY "platform_admins_analytics_read" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM platform_admins pa WHERE pa.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "org_admins_analytics_read" ON analytics_events;
CREATE POLICY "org_admins_analytics_read" ON analytics_events
  FOR SELECT USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = analytics_events.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "authenticated_analytics_insert" ON analytics_events;
CREATE POLICY "authenticated_analytics_insert" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Amistades (future-ready, Fase 3.5)
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_org_status
  ON friendships (organization_id, status);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_friendships_own" ON friendships;
CREATE POLICY "members_friendships_own" ON friendships
  FOR ALL USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

-- Ãndice dominio custom (organizations.domain ya existe)
CREATE INDEX IF NOT EXISTS idx_organizations_domain_active
  ON organizations (domain) WHERE domain IS NOT NULL AND is_active = true;

COMMENT ON TABLE analytics_events IS 'Eventos de producto para analytics por org y plataforma';
COMMENT ON TABLE friendships IS 'Relaciones entre miembros del mismo tenant (future-ready)';
 -- Fase 4: pagos, reglas deportivas documentadas en settings, PWA listo en app

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('reservation', 'event_registration')),
  reference_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_org_user ON payments (organization_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments (kind, reference_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_payments" ON payments;
CREATE POLICY "users_own_payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "org_admins_payments_read" ON payments;
CREATE POLICY "org_admins_payments_read" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = payments.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('owner', 'admin', 'org_owner', 'org_admin')
    )
  );

DROP POLICY IF EXISTS "authenticated_payments_insert" ON payments;
CREATE POLICY "authenticated_payments_insert" ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE payments IS 'Pagos Stripe para reservas y eventos de pago';

