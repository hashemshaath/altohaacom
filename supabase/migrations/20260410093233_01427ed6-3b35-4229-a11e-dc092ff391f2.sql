-- 1. FIX: companies - revoke email and phone from anon
REVOKE SELECT (email, phone) ON public.companies FROM anon;
GRANT SELECT (email, phone) ON public.companies TO service_role;

-- 2. FIX: marketing_tracking_config - hide config column, restrict to authenticated
DROP POLICY IF EXISTS "Anyone can read active configs" ON public.marketing_tracking_config;

CREATE POLICY "Authenticated can read active configs"
  ON public.marketing_tracking_config FOR SELECT
  TO authenticated
  USING (is_active = true);

REVOKE SELECT (config) ON public.marketing_tracking_config FROM anon, authenticated;
GRANT SELECT (config) ON public.marketing_tracking_config TO service_role;
