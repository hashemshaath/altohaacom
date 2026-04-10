
-- 1) email_verifications INSERT: restrict email to user's own
DROP POLICY IF EXISTS "Users can create own email verification" ON public.email_verifications;
CREATE POLICY "Users can create own email verification"
ON public.email_verifications FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
);

-- 2) email_verifications UPDATE: also protect attempts/locked_until/max_attempts
DROP POLICY IF EXISTS "Users can update own verification" ON public.email_verifications;
CREATE POLICY "Users can update own verification"
ON public.email_verifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND verification_code IS NOT DISTINCT FROM (SELECT ev.verification_code FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
  AND verified_at IS NOT DISTINCT FROM (SELECT ev.verified_at FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
  AND email IS NOT DISTINCT FROM (SELECT ev.email FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
  AND expires_at IS NOT DISTINCT FROM (SELECT ev.expires_at FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
  AND attempts IS NOT DISTINCT FROM (SELECT ev.attempts FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
  AND max_attempts IS NOT DISTINCT FROM (SELECT ev.max_attempts FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
  AND locked_until IS NOT DISTINCT FROM (SELECT ev.locked_until FROM public.email_verifications ev WHERE ev.id = email_verifications.id)
);
