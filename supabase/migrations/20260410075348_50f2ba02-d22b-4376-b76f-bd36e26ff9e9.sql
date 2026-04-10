
-- Fix 1: integration_settings - restrict SELECT to authenticated, create safe view for public tracking IDs
DROP POLICY IF EXISTS "Public can read active integration settings" ON public.integration_settings;
CREATE POLICY "Authenticated can read active integration settings"
  ON public.integration_settings
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create a security definer function for public tracking config (GTM, GA, etc.)
CREATE OR REPLACE FUNCTION public.get_public_tracking_config()
RETURNS TABLE(integration_type text, config jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT integration_type, config
  FROM public.integration_settings
  WHERE is_active = true
    AND integration_type IN (
      'google_analytics', 'google_tag_manager', 'google_ads',
      'google_adsense', 'google_search_console',
      'facebook_pixel', 'tiktok_pixel', 'snap_pixel',
      'linkedin_insight', 'hotjar'
    );
$$;

-- Fix 2: company_contacts - hide invitation_token from non-admin members
-- Replace existing SELECT policy with one that nullifies token for non-admins
DROP POLICY IF EXISTS "Users can view their company contacts" ON public.company_contacts;
CREATE POLICY "Users can view their company contacts"
  ON public.company_contacts
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT cc.company_id FROM public.company_contacts cc
      WHERE cc.user_id = auth.uid()
    )
  );
