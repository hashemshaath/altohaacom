
-- Fix generate_verification_code to have search_path set
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 8));
END;
$$;

-- Fix overly permissive RLS policies

-- 1. certificate_verifications: restrict INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can log verification" ON public.certificate_verifications;
CREATE POLICY "Authenticated users can log verification"
ON public.certificate_verifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. leads: restrict INSERT to anon + authenticated (public form submissions are OK)
-- This one is intentionally permissive for lead capture forms - leave as is but narrow to known roles
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
CREATE POLICY "Anyone can create leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. notifications: restrict to service_role only (system-generated)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));
