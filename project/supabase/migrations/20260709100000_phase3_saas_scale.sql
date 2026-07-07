-- Fase 3: escala SaaS — analytics, friendships (future), índices dominio

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

-- Índice dominio custom (organizations.domain ya existe)
CREATE INDEX IF NOT EXISTS idx_organizations_domain_active
  ON organizations (domain) WHERE domain IS NOT NULL AND is_active = true;

COMMENT ON TABLE analytics_events IS 'Eventos de producto para analytics por org y plataforma';
COMMENT ON TABLE friendships IS 'Relaciones entre miembros del mismo tenant (future-ready)';
