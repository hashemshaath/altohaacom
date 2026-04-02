
-- Add new columns to user_sessions
ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS device_name TEXT,
  ADD COLUMN IF NOT EXISTS device_os TEXT,
  ADD COLUMN IF NOT EXISTS location_country TEXT,
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days');

-- Index for device fingerprint lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_fingerprint ON public.user_sessions(device_fingerprint) WHERE device_fingerprint IS NOT NULL;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at) WHERE is_active = true;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET is_active = false, revoked_at = now()
  WHERE is_active = true AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function to detect suspicious login by comparing with previous sessions
CREATE OR REPLACE FUNCTION public.check_suspicious_login(
  p_user_id UUID,
  p_device_fingerprint TEXT,
  p_ip_address TEXT,
  p_login_hour INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_flags JSONB := '[]'::JSONB;
  v_known_device BOOLEAN;
  v_last_country TEXT;
  v_current_country TEXT;
BEGIN
  -- Check if device is known
  SELECT EXISTS(
    SELECT 1 FROM user_sessions
    WHERE user_id = p_user_id
      AND device_fingerprint = p_device_fingerprint
      AND is_active = false
    LIMIT 1
  ) OR EXISTS(
    SELECT 1 FROM user_sessions
    WHERE user_id = p_user_id
      AND device_fingerprint = p_device_fingerprint
      AND is_active = true
    LIMIT 1
  ) INTO v_known_device;

  IF NOT v_known_device THEN
    v_flags := v_flags || '"new_device"'::JSONB;
  END IF;

  -- Check unusual login time (2-5 AM)
  IF p_login_hour >= 2 AND p_login_hour <= 5 THEN
    v_flags := v_flags || '"unusual_time"'::JSONB;
  END IF;

  -- Check country change
  SELECT location_country INTO v_last_country
  FROM user_sessions
  WHERE user_id = p_user_id AND location_country IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- We'll set current country from edge function later
  -- For now, flag if we have history and IP changed significantly
  
  RETURN jsonb_build_object('flags', v_flags, 'is_known_device', v_known_device);
END;
$$;

-- Update RLS: ensure users can see their own sessions and admins see all
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
CREATE POLICY "Users can insert own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
