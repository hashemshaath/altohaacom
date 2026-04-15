-- 1. Fix competition_portfolio_entries: prevent users from setting medal/rank/score
DROP POLICY IF EXISTS "Users manage own portfolio" ON public.competition_portfolio_entries;
CREATE POLICY "Users manage own portfolio"
  ON public.competition_portfolio_entries
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND final_rank IS NULL
    AND final_score IS NULL
    AND medal IS NULL
  );

DROP POLICY IF EXISTS "Users update own portfolio" ON public.competition_portfolio_entries;
CREATE POLICY "Users update own portfolio"
  ON public.competition_portfolio_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (final_rank IS DISTINCT FROM (SELECT cpe.final_rank FROM public.competition_portfolio_entries cpe WHERE cpe.id = competition_portfolio_entries.id))
    AND NOT (final_score IS DISTINCT FROM (SELECT cpe.final_score FROM public.competition_portfolio_entries cpe WHERE cpe.id = competition_portfolio_entries.id))
    AND NOT (medal IS DISTINCT FROM (SELECT cpe.medal FROM public.competition_portfolio_entries cpe WHERE cpe.id = competition_portfolio_entries.id))
  );

-- 2. Fix email_verifications: prevent pre-verified inserts
DROP POLICY IF EXISTS "Users can create own email verification" ON public.email_verifications;
CREATE POLICY "Users can create own email verification"
  ON public.email_verifications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())::text
    AND verified_at IS NULL
  );

-- 3. Fix user_titles: prevent self-verification
DROP POLICY IF EXISTS "Users can manage own titles" ON public.user_titles;
CREATE POLICY "Users can manage own titles"
  ON public.user_titles
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (is_verified IS NULL OR is_verified = false)
    AND verified_by IS NULL
  );

DROP POLICY IF EXISTS "Users can update own titles" ON public.user_titles;
CREATE POLICY "Users can update own titles"
  ON public.user_titles
  FOR UPDATE
  USING (user_id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (
    CASE
      WHEN is_admin(auth.uid()) THEN true
      ELSE
        NOT (is_verified IS DISTINCT FROM (SELECT ut.is_verified FROM public.user_titles ut WHERE ut.id = user_titles.id))
        AND NOT (verified_by IS DISTINCT FROM (SELECT ut.verified_by FROM public.user_titles ut WHERE ut.id = user_titles.id))
    END
  );