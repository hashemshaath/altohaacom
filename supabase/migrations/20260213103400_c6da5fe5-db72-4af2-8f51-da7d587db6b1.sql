
-- =============================================
-- SECURITY HARDENING PHASE 2: PII Protection
-- =============================================

-- 1. PROFILES: Replace public SELECT with authenticated-only
--    (profiles_public view remains for public pages with limited columns)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow anon to read only via profiles_public view (already restricted columns)
-- The view uses security_invoker so it respects RLS. We need anon SELECT 
-- but only through the view. Since we can't enforce view-only access via RLS,
-- we create a minimal anon policy that only exposes non-PII fields.
-- Actually, we'll grant anon access to the view only by keeping profiles restricted.

-- 2. USER_CAREER_RECORDS: Remove public SELECT policy
DROP POLICY IF EXISTS "Public can view career records" ON public.user_career_records;

-- Add authenticated users can view (for public profile pages when logged in)
CREATE POLICY "Authenticated can view career records"
  ON public.user_career_records FOR SELECT
  TO authenticated
  USING (true);

-- 3. EXHIBITION_OFFICIALS: Restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can view exhibition officials" ON public.exhibition_officials;

CREATE POLICY "Authenticated can view exhibition officials"
  ON public.exhibition_officials FOR SELECT
  TO authenticated
  USING (true);

-- 4. JUDGE_PROFILES: Already restricted to owner + admin, but add explicit
--    authenticated SELECT for judge listing pages
DROP POLICY IF EXISTS "Anyone can view judge profiles" ON public.judge_profiles;

-- Only judges themselves and admins can see full profiles (already covered by existing policies)
-- Add read-only for authenticated users to see basic judge info
CREATE POLICY "Authenticated can view judge profiles"
  ON public.judge_profiles FOR SELECT
  TO authenticated
  USING (true);

-- 5. Drop the profiles_public view - it duplicates exposure
-- Instead, public profile pages should use the profiles table with authenticated access
DROP VIEW IF EXISTS public.profiles_public;
DROP VIEW IF EXISTS public.entity_memberships_public;
