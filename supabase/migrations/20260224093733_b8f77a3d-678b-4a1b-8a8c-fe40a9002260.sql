-- Security Events Log
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL, -- 'login_success', 'login_failed', 'password_changed', 'role_changed', 'permission_override', 'suspicious_activity', 'account_locked', 'mfa_enabled', 'session_revoked'
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  description TEXT,
  description_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_events_user ON public.security_events(user_id);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_created ON public.security_events(created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events"
  ON public.security_events FOR SELECT
  USING (public.is_admin_user());

-- Service role inserts (from edge functions)
CREATE POLICY "Service can insert security events"
  ON public.security_events FOR INSERT
  WITH CHECK (true);

-- IP Blocklist for rate limiting
CREATE TABLE public.ip_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  reason TEXT,
  blocked_by UUID,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(ip_address)
);

ALTER TABLE public.ip_blocklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ip blocklist"
  ON public.ip_blocklist FOR ALL
  USING (public.is_admin_user());

-- Session tracking
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_user());

CREATE POLICY "Users can revoke own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin_user());

CREATE POLICY "System can insert sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (true);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'info',
  p_description TEXT DEFAULT NULL,
  p_description_ar TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO security_events (user_id, event_type, severity, description, description_ar, metadata)
  VALUES (p_user_id, p_event_type, p_severity, p_description, p_description_ar, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Trigger: log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      NEW.user_id, 'role_changed', 'warning',
      'Role added: ' || NEW.role::TEXT,
      'تم إضافة دور: ' || NEW.role::TEXT,
      jsonb_build_object('action', 'add', 'role', NEW.role::TEXT, 'changed_by', auth.uid())
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      OLD.user_id, 'role_changed', 'warning',
      'Role removed: ' || OLD.role::TEXT,
      'تم إزالة دور: ' || OLD.role::TEXT,
      jsonb_build_object('action', 'remove', 'role', OLD.role::TEXT, 'changed_by', auth.uid())
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tr_log_role_change
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- Trigger: log permission overrides
CREATE OR REPLACE FUNCTION public.log_permission_override()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_security_event(
    NEW.user_id, 'permission_override', 'warning',
    'Permission override: ' || CASE WHEN NEW.granted THEN 'granted' ELSE 'revoked' END,
    'تجاوز صلاحية: ' || CASE WHEN NEW.granted THEN 'ممنوح' ELSE 'مسحوب' END,
    jsonb_build_object('permission_id', NEW.permission_id, 'granted', NEW.granted, 'changed_by', auth.uid())
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_log_permission_override
  AFTER INSERT OR UPDATE ON public.user_permission_overrides
  FOR EACH ROW EXECUTE FUNCTION public.log_permission_override();