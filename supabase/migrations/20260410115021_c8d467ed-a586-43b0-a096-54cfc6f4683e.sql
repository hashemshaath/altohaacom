
-- 1) email_verifications: restrict UPDATE to only attempts and locked_until
DROP POLICY IF EXISTS "Users can update own verification" ON public.email_verifications;
CREATE POLICY "Users can update own verification"
ON public.email_verifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND verification_code IS NOT DISTINCT FROM (SELECT ev.verification_code FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
  AND verified_at IS NOT DISTINCT FROM (SELECT ev.verified_at FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
  AND email IS NOT DISTINCT FROM (SELECT ev.email FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
);

-- 2) phone_verifications: remove direct UPDATE entirely
DROP POLICY IF EXISTS "Users can update own phone verification" ON public.phone_verifications;

-- 3) user_challenges: prevent self-completion
DROP POLICY IF EXISTS "Users can update own challenges" ON public.user_challenges;
CREATE POLICY "Users can update own challenges"
ON public.user_challenges FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND completed_at IS NOT DISTINCT FROM (SELECT uc.completed_at FROM public.user_challenges uc WHERE uc.id = user_challenges.id)
  AND claimed_at IS NOT DISTINCT FROM (SELECT uc.claimed_at FROM public.user_challenges uc WHERE uc.id = user_challenges.id)
);
