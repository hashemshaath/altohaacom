-- ============================================================
-- PHASE 1: PERMISSION-BASED ACCESS CONTROL (PBAC)
-- ============================================================

INSERT INTO permissions (code, name, name_ar, category, description, description_ar) VALUES
  ('invoice.read', 'View Invoices', 'عرض الفواتير', 'finance', 'Can view invoices', 'يمكنه عرض الفواتير'),
  ('invoice.create', 'Create Invoices', 'إنشاء الفواتير', 'finance', 'Can create invoices', 'يمكنه إنشاء الفواتير'),
  ('invoice.approve', 'Approve Invoices', 'اعتماد الفواتير', 'finance', 'Can approve invoices', 'يمكنه اعتماد الفواتير'),
  ('settings.read', 'View Settings', 'عرض الإعدادات', 'admin', 'Can view system settings', 'يمكنه عرض إعدادات النظام'),
  ('settings.update', 'Update Settings', 'تحديث الإعدادات', 'admin', 'Can update system settings', 'يمكنه تحديث إعدادات النظام'),
  ('finance.view', 'View Financial Data', 'عرض البيانات المالية', 'finance', 'Can view financial reports', 'يمكنه عرض التقارير المالية'),
  ('finance.manage', 'Manage Finances', 'إدارة الشؤون المالية', 'finance', 'Can manage financial operations', 'يمكنه إدارة العمليات المالية'),
  ('user.view_pii', 'View User PII', 'عرض البيانات الشخصية', 'admin', 'Can view personal identifiable info', 'يمكنه عرض البيانات الشخصية'),
  ('competition.manage_own', 'Manage Own Competitions', 'إدارة مسابقاته', 'competition', 'Can manage own competitions', 'يمكنه إدارة مسابقاته الخاصة'),
  ('exhibition.manage_own', 'Manage Own Exhibitions', 'إدارة معارضه', 'exhibition', 'Can manage own exhibitions', 'يمكنه إدارة معارضه الخاصة'),
  ('competition.delete', 'Delete Competitions', 'حذف المسابقات', 'competition', 'Can delete competitions', 'يمكنه حذف المسابقات')
ON CONFLICT (code) DO NOTHING;

DELETE FROM role_permissions
WHERE role = 'organizer'
  AND permission_id IN (
    SELECT id FROM permissions WHERE code IN ('admin.manage_users', 'admin.manage_roles')
  );

INSERT INTO role_permissions (role, permission_id)
SELECT 'supervisor', id FROM permissions WHERE code IN (
  'invoice.read', 'invoice.create', 'invoice.approve',
  'settings.read', 'settings.update',
  'finance.view', 'finance.manage',
  'user.view_pii',
  'competition.manage_own', 'exhibition.manage_own', 'competition.delete'
)
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'organizer', id FROM permissions WHERE code IN (
  'competition.manage_own', 'exhibition.manage_own'
)
ON CONFLICT (role, permission_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_has boolean := false;
  v_override boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN false; END IF;

  SELECT EXISTS (
    SELECT 1 FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    JOIN user_roles ur ON ur.role = rp.role
    WHERE ur.user_id = v_user_id AND p.code = p_permission_code
  ) INTO v_has;

  SELECT upo.granted INTO v_override
  FROM user_permission_overrides upo
  JOIN permissions p ON p.id = upo.permission_id
  WHERE upo.user_id = v_user_id AND p.code = p_permission_code
  LIMIT 1;

  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  RETURN v_has;
END;
$$;

-- ============================================================
-- PHASE 2: STRICT RLS HARDENING
-- ============================================================

DROP POLICY IF EXISTS "Admins can create invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can create own invoices" ON invoices;

CREATE POLICY "PBAC: admin invoice access"
  ON invoices FOR ALL TO authenticated
  USING (public.has_permission('invoice.read'))
  WITH CHECK (public.has_permission('invoice.create'));

CREATE POLICY "Users can create own invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON wallet_transactions;

CREATE POLICY "PBAC: finance view wallet txns"
  ON wallet_transactions FOR SELECT TO authenticated
  USING (
    wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
    OR public.has_permission('finance.view')
  );

CREATE POLICY "PBAC: finance manage wallet txns"
  ON wallet_transactions FOR ALL TO authenticated
  USING (public.has_permission('finance.manage'))
  WITH CHECK (public.has_permission('finance.manage'));

DROP POLICY IF EXISTS "Admins can manage transactions" ON company_transactions;

CREATE POLICY "PBAC: finance manage company txns"
  ON company_transactions FOR ALL TO authenticated
  USING (public.has_permission('finance.manage'))
  WITH CHECK (public.has_permission('finance.manage'));

DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can delete site settings" ON site_settings;

CREATE POLICY "PBAC: settings update"
  ON site_settings FOR UPDATE TO authenticated
  USING (public.has_permission('settings.update'));

CREATE POLICY "PBAC: settings insert"
  ON site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('settings.update'));

CREATE POLICY "PBAC: settings delete"
  ON site_settings FOR DELETE TO authenticated
  USING (public.has_permission('settings.update'));

-- ============================================================
-- PHASE 3: PROTECT SENSITIVE DATA
-- ============================================================

CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = true)
AS
SELECT
  user_id,
  username,
  full_name,
  full_name_ar,
  avatar_url,
  bio,
  bio_ar,
  country_code,
  city,
  account_type,
  membership_tier,
  is_verified,
  is_chef_visible,
  profile_visibility,
  created_at,
  CASE WHEN user_id = auth.uid() OR public.has_permission('user.view_pii')
    THEN email ELSE NULL END AS email,
  CASE WHEN user_id = auth.uid() OR public.has_permission('user.view_pii')
    THEN phone ELSE NULL END AS phone,
  CASE WHEN user_id = auth.uid() OR public.has_permission('user.view_pii')
    THEN date_of_birth ELSE NULL END AS date_of_birth
FROM profiles;

-- ============================================================
-- PHASE 6: ENHANCED AUDIT LOGGING
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors can read audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action_type, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action_type text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_role text;
BEGIN
  SELECT ur.role INTO v_role
  FROM user_roles ur
  WHERE ur.user_id = auth.uid()
  ORDER BY CASE ur.role
    WHEN 'supervisor' THEN 1 WHEN 'organizer' THEN 2 WHEN 'content_writer' THEN 3 ELSE 4
  END
  LIMIT 1;

  INSERT INTO audit_logs (actor_id, actor_role, action_type, entity_type, entity_id, old_value, new_value)
  VALUES (auth.uid(), v_role, p_action_type, p_entity_type, p_entity_id, p_old_value, p_new_value)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Audit trigger: invoices
CREATE OR REPLACE FUNCTION public.trg_audit_invoices()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (actor_id, action_type, entity_type, entity_id, new_value)
    VALUES (auth.uid(), 'create', 'invoice', NEW.id::text, jsonb_build_object('status', NEW.status, 'amount', NEW.amount));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (actor_id, action_type, entity_type, entity_id, old_value, new_value)
    VALUES (auth.uid(), 'update', 'invoice', NEW.id::text,
      jsonb_build_object('status', OLD.status, 'amount', OLD.amount),
      jsonb_build_object('status', NEW.status, 'amount', NEW.amount));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (actor_id, action_type, entity_type, entity_id, old_value)
    VALUES (auth.uid(), 'delete', 'invoice', OLD.id::text, jsonb_build_object('status', OLD.status, 'amount', OLD.amount));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION trg_audit_invoices();

-- Audit trigger: user_roles
CREATE OR REPLACE FUNCTION public.trg_audit_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (actor_id, action_type, entity_type, entity_id, new_value)
    VALUES (auth.uid(), 'role_assigned', 'user_role', NEW.user_id::text, jsonb_build_object('role', NEW.role::text));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (actor_id, action_type, entity_type, entity_id, old_value)
    VALUES (auth.uid(), 'role_removed', 'user_role', OLD.user_id::text, jsonb_build_object('role', OLD.role::text));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_user_roles ON user_roles;
CREATE TRIGGER audit_user_roles AFTER INSERT OR DELETE ON user_roles FOR EACH ROW EXECUTE FUNCTION trg_audit_user_roles();

-- Audit trigger: wallet_transactions
CREATE OR REPLACE FUNCTION public.trg_audit_wallet_transactions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, action_type, entity_type, entity_id, new_value)
  VALUES (auth.uid(), 'wallet_txn', 'wallet_transaction', NEW.id::text,
    jsonb_build_object('type', NEW.type, 'amount', NEW.amount, 'wallet_id', NEW.wallet_id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_wallet_transactions ON wallet_transactions;
CREATE TRIGGER audit_wallet_transactions AFTER INSERT ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION trg_audit_wallet_transactions();

-- Audit trigger: site_settings
CREATE OR REPLACE FUNCTION public.trg_audit_site_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, action_type, entity_type, entity_id, old_value, new_value)
  VALUES (auth.uid(), TG_OP, 'site_setting', COALESCE(NEW.key, OLD.key),
    CASE WHEN OLD IS NOT NULL THEN jsonb_build_object('value', OLD.value) ELSE NULL END,
    CASE WHEN NEW IS NOT NULL THEN jsonb_build_object('value', NEW.value) ELSE NULL END);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_site_settings ON site_settings;
CREATE TRIGGER audit_site_settings AFTER INSERT OR UPDATE OR DELETE ON site_settings FOR EACH ROW EXECUTE FUNCTION trg_audit_site_settings();

-- ============================================================
-- PHASE 8: IDEMPOTENCY & RACE CONDITIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  entity_id text,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own idempotency keys"
  ON idempotency_keys FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.check_idempotency(p_key text, p_operation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_existing jsonb;
BEGIN
  DELETE FROM idempotency_keys WHERE expires_at < now();
  SELECT response INTO v_existing
  FROM idempotency_keys
  WHERE idempotency_key = p_key AND user_id = auth.uid() AND operation = p_operation;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('duplicate', true, 'response', v_existing);
  END IF;
  INSERT INTO idempotency_keys (idempotency_key, user_id, operation)
  VALUES (p_key, auth.uid(), p_operation)
  ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN jsonb_build_object('duplicate', false);
END;
$$;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- ============================================================
-- PHASE 5: APPROVAL WORKFLOWS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  requested_by uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters can view own requests"
  ON approval_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Authenticated can create requests"
  ON approval_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Supervisors can update requests"
  ON approval_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.request_approval(
  p_type text, p_entity_type text, p_entity_id text, p_payload jsonb DEFAULT '{}'
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO approval_requests (request_type, entity_type, entity_id, requested_by, payload)
  VALUES (p_type, p_entity_type, p_entity_id, auth.uid(), p_payload)
  RETURNING id INTO v_id;
  PERFORM log_audit_event('approval_requested', p_entity_type, p_entity_id,
    NULL, jsonb_build_object('request_id', v_id, 'type', p_type));
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_approval(
  p_request_id uuid, p_approved boolean, p_reason text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_request approval_requests;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only supervisors can process approvals';
  END IF;
  SELECT * INTO v_request FROM approval_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  IF v_request.requested_by = auth.uid() THEN
    RAISE EXCEPTION 'Cannot approve own request (maker-checker violation)';
  END IF;
  UPDATE approval_requests
  SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
      approved_by = auth.uid(), approved_at = now(), rejection_reason = p_reason
  WHERE id = p_request_id;
  PERFORM log_audit_event(
    CASE WHEN p_approved THEN 'approval_granted' ELSE 'approval_rejected' END,
    v_request.entity_type, v_request.entity_id,
    NULL, jsonb_build_object('request_id', p_request_id, 'approved', p_approved));
  RETURN p_approved;
END;
$$;