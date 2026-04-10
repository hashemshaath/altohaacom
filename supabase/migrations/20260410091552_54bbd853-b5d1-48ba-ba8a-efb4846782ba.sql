-- 1. FIX: companies - revoke credit_limit and payment_terms from public (re-ensure)
REVOKE SELECT (credit_limit, payment_terms) ON public.companies FROM anon, authenticated;
GRANT SELECT (credit_limit, payment_terms) ON public.companies TO service_role;

-- 2. FIX: tasting_judges - restrict to organizer, judge, admin
DROP POLICY IF EXISTS "Anyone can view tasting judges" ON public.tasting_judges;

CREATE POLICY "Organizer or judge can view tasting judges"
  ON public.tasting_judges FOR SELECT
  USING (
    judge_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tasting_sessions
      WHERE tasting_sessions.id = tasting_judges.session_id
        AND tasting_sessions.organizer_id = auth.uid()
    )
    OR is_admin(auth.uid())
  );

-- 3. FIX: bio_subscribers - remove old anon INSERT policy, keep authenticated only
DROP POLICY IF EXISTS "Anyone can subscribe with email" ON public.bio_subscribers;
