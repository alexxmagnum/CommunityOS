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
