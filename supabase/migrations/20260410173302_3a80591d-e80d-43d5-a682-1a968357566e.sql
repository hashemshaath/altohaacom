
-- 1. Fix profiles: add a public-profile SELECT policy so service_role isn't needed
-- Drop any stale policies first
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

CREATE POLICY "Public profiles readable"
ON public.profiles FOR SELECT TO authenticated
USING (
  profile_visibility = 'public'
  AND account_status = 'active'
);

-- 2. Ensure email_verifications SELECT is fully removed
DROP POLICY IF EXISTS "Users can view own email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can read own verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can view own email verification" ON public.email_verifications;
