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
    RAISE EXCEPTION 'Este horario ya no está disponible';
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
