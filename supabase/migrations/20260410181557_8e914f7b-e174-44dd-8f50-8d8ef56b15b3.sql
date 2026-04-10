
-- 1. Fix blind judging leak in competition_feedback
DROP POLICY IF EXISTS "View feedback" ON public.competition_feedback;
CREATE POLICY "View feedback" ON public.competition_feedback FOR SELECT USING (
  auth.uid() = judge_id
  OR public.is_admin_user()
  OR (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM competition_registrations cr
      WHERE cr.id = competition_feedback.registration_id
      AND cr.participant_id = auth.uid()
    )
    AND NOT public.is_blind_judging_competition(competition_id)
  )
);

-- 2. Harden profile INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (membership_tier IS NULL OR membership_tier = 'basic')
    AND (is_verified IS NULL OR is_verified = false)
    AND (account_status IS NULL OR account_status = 'active')
    AND (wallet_balance IS NULL OR wallet_balance = 0)
    AND (loyalty_points IS NULL OR loyalty_points = 0)
    AND (verification_level IS NULL OR verification_level = 'none')
    AND (verification_badge IS NULL)
    AND (verified_at IS NULL)
    AND (company_id IS NULL)
    AND (company_role IS NULL OR company_role = '')
    AND (account_type IS NULL OR account_type IN ('professional', 'fan'))
  );
