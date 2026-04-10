
-- 1) user_challenges: remove old public policy that overrides protection
DROP POLICY IF EXISTS "Users update own challenges" ON public.user_challenges;

-- 2) email_verifications: remove old public policy that overrides protection
DROP POLICY IF EXISTS "Users can update own email verification" ON public.email_verifications;
