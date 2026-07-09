-- Sprint S2: dominios custom en producción + RLS/permisos fiables
-- Ejecutar en Supabase SQL Editor (idempotente).

-- =============================================================================
-- 1) RPC — resolver slug por dominio (middleware edge)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_slug_by_domain(p_domain text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.slug
  FROM organizations o
  WHERE o.is_active = true
    AND o.domain IS NOT NULL
    AND lower(trim(o.domain)) = lower(trim(p_domain))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_slug_by_domain(text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_slug_by_domain(text) IS
  'Devuelve slug de org activa por hostname (custom domain). Usado en middleware.';

-- Índice único parcial: un dominio por org activa
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_domain_unique
  ON organizations (lower(trim(domain)))
  WHERE domain IS NOT NULL AND is_active = true;

-- =============================================================================
-- 2) FK organization_members.role_id → roles
-- =============================================================================
UPDATE organization_members om
SET role_id = NULL
WHERE role_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = om.role_id);

ALTER TABLE organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_id_fkey;

ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- =============================================================================
-- 3) Analytics — solo roles org_owner / org_admin
-- =============================================================================
DROP POLICY IF EXISTS "org_admins_analytics_read" ON analytics_events;
CREATE POLICY "org_admins_analytics_read" ON analytics_events
  FOR SELECT USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = analytics_events.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('org_owner', 'org_admin')
    )
  );

-- =============================================================================
-- 4) Friendships — solo miembros activos del mismo tenant
-- =============================================================================
DROP POLICY IF EXISTS "members_friendships_own" ON friendships;
CREATE POLICY "members_friendships_own" ON friendships
  FOR ALL USING (
    (requester_id = auth.uid() OR addressee_id = auth.uid())
    AND organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
    )
  )
  WITH CHECK (
    (requester_id = auth.uid() OR addressee_id = auth.uid())
    AND organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- =============================================================================
-- 5) Payments — unificar roles (por si quedó owner/admin obsoleto)
-- =============================================================================
DROP POLICY IF EXISTS "org_admins_payments_read" ON payments;
CREATE POLICY "org_admins_payments_read" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = payments.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );
