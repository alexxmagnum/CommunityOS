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
    ('first_reservation', 'Primera reserva', 'Reservaste instalación o mesa', 'calendar', '{"type":"reservation","count":1}', 10),
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
      (org_uuid, tournament_uuid, 'Equipo García', 1, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo López', 2, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Martín', 3, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Ruiz', 4, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Soto', 5, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Vega', 6, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Costa', 7, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Núñez', 8, 'registered');
  END IF;
END $$;
