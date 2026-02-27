
-- Daily aggregated feature usage stats per feature per tier
CREATE TABLE public.membership_feature_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_id UUID NOT NULL REFERENCES public.membership_features(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'basic',
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  access_count INTEGER NOT NULL DEFAULT 1,
  unique_users INTEGER NOT NULL DEFAULT 1,
  blocked_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feature_id, tier, usage_date)
);

-- Enable RLS
ALTER TABLE public.membership_feature_usage ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view feature usage" ON public.membership_feature_usage
  FOR SELECT USING (public.is_admin_user());

-- Only system (service role) or admins can insert/update
CREATE POLICY "Admins can manage feature usage" ON public.membership_feature_usage
  FOR ALL USING (public.is_admin_user());

-- Allow anon/authenticated to insert via upsert (for logging)
CREATE POLICY "Authenticated users can log usage" ON public.membership_feature_usage
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Index for fast queries
CREATE INDEX idx_feature_usage_date ON public.membership_feature_usage(usage_date DESC);
CREATE INDEX idx_feature_usage_feature ON public.membership_feature_usage(feature_id);

-- Function to log a feature access (called from frontend hook)
CREATE OR REPLACE FUNCTION public.log_feature_access(
  p_feature_code TEXT,
  p_tier TEXT,
  p_was_blocked BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feature_id UUID;
BEGIN
  SELECT id INTO v_feature_id FROM membership_features WHERE code = p_feature_code AND is_active = true;
  IF v_feature_id IS NULL THEN RETURN; END IF;

  INSERT INTO membership_feature_usage (feature_id, tier, usage_date, access_count, unique_users, blocked_count)
  VALUES (
    v_feature_id,
    p_tier,
    CURRENT_DATE,
    1,
    1,
    CASE WHEN p_was_blocked THEN 1 ELSE 0 END
  )
  ON CONFLICT (feature_id, tier, usage_date)
  DO UPDATE SET
    access_count = membership_feature_usage.access_count + 1,
    blocked_count = membership_feature_usage.blocked_count + (CASE WHEN p_was_blocked THEN 1 ELSE 0 END),
    updated_at = now();
END;
$$;
