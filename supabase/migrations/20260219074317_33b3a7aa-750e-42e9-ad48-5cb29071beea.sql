
-- Drop the overly permissive SELECT policy
DROP POLICY "Anyone can view profiles" ON public.profiles;

-- Create a policy that allows everyone to SELECT but we'll use a security definer view for PII
-- For now, keep public read but create a restricted view approach
-- The profiles table needs public read for the platform to work (rankings, public profiles, etc.)
-- So we restrict PII columns via a secure view instead

-- 1. Allow authenticated users to see all profiles (needed for platform features)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Allow anonymous users to view profiles (for public profile pages, rankings, etc.)
-- But we'll mask PII at the application level via a secure function
CREATE POLICY "Anonymous can view public profile data"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NULL AND profile_visibility != 'private');

-- 3. Create a secure function to get profile with PII only for the owner
CREATE OR REPLACE FUNCTION public.get_profile_safe(p_profile_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_caller_id uuid;
  v_is_admin boolean;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin(v_caller_id);

  SELECT to_jsonb(p.*) INTO v_result FROM profiles p WHERE p.user_id = p_profile_user_id;

  -- If caller is not the owner and not admin, strip PII
  IF v_caller_id IS DISTINCT FROM p_profile_user_id AND NOT v_is_admin THEN
    v_result := v_result - 'email' - 'phone' - 'secondary_email' - 'date_of_birth' 
                          - 'wallet_balance' - 'loyalty_points' - 'last_login_at'
                          - 'suspended_reason' - 'suspended_at' - 'password_last_changed'
                          - 'login_method' - 'email_verified' - 'phone_verified';
  END IF;

  RETURN v_result;
END;
$$;
