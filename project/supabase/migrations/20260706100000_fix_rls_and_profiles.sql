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
