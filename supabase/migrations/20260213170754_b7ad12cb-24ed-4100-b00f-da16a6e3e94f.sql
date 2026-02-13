
-- Fix overly permissive RLS policy for company registration (should require authentication)
DROP POLICY IF EXISTS "Anyone can create company registration" ON public.company_registration_requests;

CREATE POLICY "Authenticated users can create company registration" ON public.company_registration_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix phone_verifications INSERT policy - should require auth
DROP POLICY IF EXISTS "Users can create phone verification" ON public.phone_verifications;

CREATE POLICY "Authenticated users can create phone verification" ON public.phone_verifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix email_verifications INSERT policy - should require auth
DROP POLICY IF EXISTS "Users can create email verification" ON public.email_verifications;

CREATE POLICY "Authenticated users can create email verification" ON public.email_verifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix phone_verifications SELECT for unauthenticated
DROP POLICY IF EXISTS "Users can view own phone verification" ON public.phone_verifications;

CREATE POLICY "Users can view own phone verification" ON public.phone_verifications
  FOR SELECT USING (user_id = auth.uid());

-- Fix email_verifications SELECT for unauthenticated  
DROP POLICY IF EXISTS "Users can view own email verification" ON public.email_verifications;

CREATE POLICY "Users can view own email verification" ON public.email_verifications
  FOR SELECT USING (user_id = auth.uid());
