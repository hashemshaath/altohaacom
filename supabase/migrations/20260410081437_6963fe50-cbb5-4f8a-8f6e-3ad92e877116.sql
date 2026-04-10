
-- Fix: profile_views - revoke sensitive columns from authenticated
REVOKE SELECT (viewer_ip, viewer_user_agent) ON public.profile_views FROM authenticated;
REVOKE SELECT (viewer_ip, viewer_user_agent) ON public.profile_views FROM anon;
GRANT SELECT (viewer_ip, viewer_user_agent) ON public.profile_views TO service_role;

-- Fix: referral_clicks - revoke sensitive columns
REVOKE SELECT (ip_address, user_agent) ON public.referral_clicks FROM authenticated;
REVOKE SELECT (ip_address, user_agent) ON public.referral_clicks FROM anon;
GRANT SELECT (ip_address, user_agent) ON public.referral_clicks TO service_role;
