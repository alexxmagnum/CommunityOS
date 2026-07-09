-- =============================================================================
-- APPLY_FIXES_FINAL.sql — Estado final correcto (RLS, aislamiento, funciones)
--
-- Consolida y reemplaza todos los FIX_*.sql sueltos. Es IDEMPOTENTE:
-- puedes ejecutarlo tantas veces como quieras sin romper nada.
--
-- Orden de ejecución en Supabase → SQL Editor:
--   1) APPLY_ALL.sql               (esquema base: migraciones 1-3)
--   2) APPLY_SEED_AND_PHASES.sql   (seed IKON + fases 1-4)
--   3) APPLY_FIXES_FINAL.sql       (este archivo)
--   4) (opcional) sección SEED ADMIN del final, cambiando el email
--
-- Si tu base ya está creada, con ejecutar este archivo basta para dejar
-- las políticas y funciones en su estado correcto.
-- =============================================================================


-- =============================================================================
-- 1) FUNCIÓN ANTI-RECURSIÓN PARA ADMIN DE ORGANIZACIÓN
--    Evita "infinite recursion detected in policy for organization_members".
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_org_admin_of(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN roles r ON r.id = om.role_id
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_admin_of(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_admin_of(uuid) TO authenticated;


-- =============================================================================
-- 2) ORGANIZATION_MEMBERS — políticas sin recursión
-- =============================================================================
DROP POLICY IF EXISTS "org_members_read_own_org" ON organization_members;
CREATE POLICY "org_members_read_own_org" ON organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR public.is_org_admin_of(organization_id)
  );

DROP POLICY IF EXISTS "org_admins_manage_members" ON organization_members;
CREATE POLICY "org_admins_manage_members" ON organization_members FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR public.is_org_admin_of(organization_id)
    OR user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR public.is_org_admin_of(organization_id)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "platform_admins_members" ON organization_members;
CREATE POLICY "platform_admins_members" ON organization_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Roles legibles por cualquier autenticado (necesario para joins y checks)
DROP POLICY IF EXISTS "roles_read_authenticated" ON roles;
CREATE POLICY "roles_read_authenticated" ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Cada usuario puede crear/leer su propio perfil
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Cada usuario puede leer su propio registro de admin de plataforma
DROP POLICY IF EXISTS "platform_admins_read_own" ON platform_admins;
CREATE POLICY "platform_admins_read_own" ON platform_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- =============================================================================
-- 3) AISLAMIENTO MULTI-TENANT — cada socio solo ve datos de sus clubs
-- =============================================================================

-- RESERVAS: el socio solo ve las suyas dentro de orgs donde es miembro activo
DROP POLICY IF EXISTS "reservations_read_own" ON reservations;
CREATE POLICY "reservations_read_own" ON reservations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "reservations_read_platform_admin" ON reservations;
CREATE POLICY "reservations_read_platform_admin" ON reservations FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Admin del club sigue viendo TODAS las reservas de su org (política aparte)
DROP POLICY IF EXISTS "reservations_read_org_admin" ON reservations;
CREATE POLICY "reservations_read_org_admin" ON reservations FOR SELECT
  TO authenticated
  USING (public.is_org_admin_of(organization_id));

-- NOTIFICACIONES: solo las del usuario dentro de sus clubs
DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "notifications_read_platform_admin" ON notifications;
CREATE POLICY "notifications_read_platform_admin" ON notifications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- INSCRIPCIONES A EVENTOS
DROP POLICY IF EXISTS "event_participants_read_own" ON event_participants;
CREATE POLICY "event_participants_read_own" ON event_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_participants_read_platform_admin" ON event_participants;
CREATE POLICY "event_participants_read_platform_admin" ON event_participants FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "event_participants_read_org_admin" ON event_participants;
CREATE POLICY "event_participants_read_org_admin" ON event_participants FOR SELECT
  TO authenticated
  USING (public.is_org_admin_of(organization_id));

-- LISTA DE ESPERA
DROP POLICY IF EXISTS "event_waitlist_read_own" ON event_waitlist;
CREATE POLICY "event_waitlist_read_own" ON event_waitlist FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_waitlist_read_platform_admin" ON event_waitlist;
CREATE POLICY "event_waitlist_read_platform_admin" ON event_waitlist FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));


-- =============================================================================
-- 4) LECTURA PÚBLICA (anon) — acotada a organizaciones activas
-- =============================================================================
DROP POLICY IF EXISTS "activity_feed_public_read" ON activity_feed;
CREATE POLICY "activity_feed_public_read" ON activity_feed FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "events_public_read" ON events;
CREATE POLICY "events_public_read" ON events FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND is_public = true
    AND deleted_at IS NULL
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "facilities_public_read" ON facilities;
CREATE POLICY "facilities_public_read" ON facilities FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "restaurants_public_read" ON restaurants;
CREATE POLICY "restaurants_public_read" ON restaurants FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

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

DROP POLICY IF EXISTS "spaces_public_read_active_orgs" ON spaces;
CREATE POLICY "spaces_public_read_active_orgs" ON spaces FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND is_bookable = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "organizations_public_read" ON organizations;
CREATE POLICY "organizations_public_read" ON organizations FOR SELECT
  TO anon, authenticated
  USING (is_active = true);


-- =============================================================================
-- 5) BUGFIX — analytics: admins de club usan rol org_owner/org_admin
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
-- 6) FUNCIONES RPC QUE USA LA APP
-- =============================================================================

-- Membresías del usuario (evita bloqueos RLS en el login)
CREATE OR REPLACE FUNCTION public.get_my_memberships()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    json_agg(
      json_build_object(
        'id', om.id,
        'organization_id', om.organization_id,
        'role_id', om.role_id,
        'status', om.status,
        'organization', json_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug,
          'logo_url', o.logo_url,
          'primary_color', o.primary_color,
          'secondary_color', o.secondary_color,
          'accent_color', o.accent_color
        ),
        'role', json_build_object(
          'id', r.id,
          'name', r.name,
          'display_name', r.display_name
        )
      )
    ),
    '[]'::json
  )
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  JOIN roles r ON r.id = om.role_id
  WHERE om.user_id = auth.uid()
    AND om.status = 'active';
$$;

REVOKE ALL ON FUNCTION public.get_my_memberships() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_memberships() TO authenticated;

-- Datos públicos de un club por slug (para la web pública del tenant)
CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(p_slug text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(t)
  FROM (
    SELECT
      id, name, slug, domain, logo_url, favicon_url,
      primary_color, secondary_color, accent_color,
      font_family, theme_mode, modules
    FROM organizations
    WHERE slug = p_slug
      AND is_active = true
    LIMIT 1
  ) t;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_by_slug(text) TO anon, authenticated;

-- Lista de organizaciones para el panel de plataforma
CREATE OR REPLACE FUNCTION public.get_platform_organizations()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()) THEN
      coalesce(
        (
          SELECT json_agg(row_to_json(t) ORDER BY t.created_at DESC)
          FROM (
            SELECT
              o.*,
              (
                SELECT count(*)::int
                FROM organization_members om
                WHERE om.organization_id = o.id
                  AND om.status = 'active'
              ) AS member_count
            FROM organizations o
          ) t
        ),
        '[]'::json
      )
    ELSE '[]'::json
  END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_organizations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_organizations() TO authenticated;

-- Preview público de invitación por token (sin filtrar datos sensibles)
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


-- =============================================================================
-- 7) (OPCIONAL) SEED ADMIN — descomenta y cambia el email para asignar dueño
--
--    ⚠️ Cambia 'alexxstazy@gmail.com' por el email real antes de ejecutar.
--    El usuario debe existir ya en Authentication → Users.
-- =============================================================================

-- -- Plataforma (super admin de Community OS)
-- INSERT INTO platform_admins (user_id, role)
-- SELECT u.id, 'owner'
-- FROM auth.users u
-- WHERE lower(u.email) = lower('alexxstazy@gmail.com')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- -- Dueño de IKON
-- INSERT INTO organization_members (organization_id, user_id, role_id, status)
-- SELECT o.id, u.id,
--   (SELECT id FROM roles WHERE name = 'org_owner' AND organization_id IS NULL LIMIT 1),
--   'active'
-- FROM auth.users u
-- CROSS JOIN organizations o
-- WHERE lower(u.email) = lower('alexxstazy@gmail.com')
--   AND o.slug = 'ikon'
-- ON CONFLICT (organization_id, user_id) DO UPDATE
--   SET role_id = EXCLUDED.role_id, status = 'active';

-- =============================================================================
-- FIN
-- =============================================================================
