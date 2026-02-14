-- Fix verification_audit_log: require authenticated user
DROP POLICY IF EXISTS "Authenticated users can insert audit" ON public.verification_audit_log;
CREATE POLICY "Authenticated users can insert audit"
ON public.verification_audit_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix certificate_verifications: require authenticated user  
DROP POLICY IF EXISTS "Authenticated users can log verification" ON public.certificate_verifications;
CREATE POLICY "Authenticated users can log verification"
ON public.certificate_verifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Tighten referral_clicks: only allow insert via service role (edge function)
-- Remove the public insert policy since tracking is done via edge function
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.referral_clicks;

-- Leads and newsletter remain public intentionally for marketing lead capture
-- Profile views and QR scan logs remain public intentionally for anonymous tracking