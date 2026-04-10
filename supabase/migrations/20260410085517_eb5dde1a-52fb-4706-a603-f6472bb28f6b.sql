-- 1. FIX: email_verifications - remove user_id IS NULL branch
DROP POLICY IF EXISTS "Users can create verifications" ON public.email_verifications;

CREATE POLICY "Users can create own verifications"
  ON public.email_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. FIX: membership_referrals - enforce referrer_id = auth.uid()
DROP POLICY IF EXISTS "Users can create referrals" ON public.membership_referrals;
DROP POLICY IF EXISTS "Authenticated users can insert referrals" ON public.membership_referrals;

CREATE POLICY "Users can create own referrals"
  ON public.membership_referrals FOR INSERT
  TO authenticated
  WITH CHECK (referrer_id = auth.uid());
