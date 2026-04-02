
-- ============================================
-- 1. User PINs table
-- ============================================
CREATE TABLE public.user_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  hashed_pin TEXT NOT NULL,
  pin_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
  pin_locked_until TIMESTAMPTZ,
  device_fingerprint TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PIN record"
  ON public.user_pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own PIN"
  ON public.user_pins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view PINs"
  ON public.user_pins FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_user_pins_user ON public.user_pins(user_id);

-- ============================================
-- 2. Trusted devices table
-- ============================================
CREATE TABLE public.trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, device_fingerprint)
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own devices"
  ON public.trusted_devices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_trusted_devices_user ON public.trusted_devices(user_id);

-- ============================================
-- 3. Auth audit log table
-- ============================================
CREATE TABLE public.auth_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view auth audit logs"
  ON public.auth_audit_log FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated can insert auth audit"
  ON public.auth_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Service role can always insert (for edge functions)
CREATE POLICY "Service can insert auth audit"
  ON public.auth_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_auth_audit_action ON public.auth_audit_log(action_type);
CREATE INDEX idx_auth_audit_user ON public.auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_created ON public.auth_audit_log(created_at DESC);

-- ============================================
-- 4. Password reset rate limiting table
-- ============================================
CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or phone
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.password_reset_requests FOR ALL
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_reset_requests_identifier ON public.password_reset_requests(identifier, requested_at DESC);

-- ============================================
-- 5. Rate limit check function
-- ============================================
CREATE OR REPLACE FUNCTION public.check_reset_rate_limit(p_identifier TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM password_reset_requests
  WHERE identifier = LOWER(p_identifier)
    AND requested_at > now() - INTERVAL '1 hour';
  RETURN v_count < 3;
END;
$$;

-- ============================================
-- 6. Updated_at trigger for user_pins
-- ============================================
CREATE TRIGGER update_user_pins_updated_at
  BEFORE UPDATE ON public.user_pins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
