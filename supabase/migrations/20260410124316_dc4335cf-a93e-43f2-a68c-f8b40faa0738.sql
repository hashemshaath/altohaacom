
-- 1) CRITICAL: remove the old permissive UPDATE policy on email_verifications
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
);

-- 2) poll_votes: scope to own votes
DROP POLICY IF EXISTS "Authenticated users can view votes" ON public.poll_votes;
CREATE POLICY "Users can view own votes"
ON public.poll_votes FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view votes" ON public.post_poll_votes;
CREATE POLICY "Users can view own poll votes"
ON public.post_poll_votes FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- 3) Remove remaining PUBLIC select policies on attendance tables
DROP POLICY IF EXISTS "Public can view event attendees" ON public.event_attendees;
DROP POLICY IF EXISTS "Public can view live session attendees" ON public.live_session_attendees;
