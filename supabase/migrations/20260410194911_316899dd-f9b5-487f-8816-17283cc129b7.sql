-- Add global_awards to protected fields in profiles UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (email IS DISTINCT FROM (SELECT p.email FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (secondary_email IS DISTINCT FROM (SELECT p.secondary_email FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (account_type IS DISTINCT FROM (SELECT p.account_type FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (company_id IS DISTINCT FROM (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (company_role IS DISTINCT FROM (SELECT p.company_role FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (suspended_at IS DISTINCT FROM (SELECT p.suspended_at FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (suspended_reason IS DISTINCT FROM (SELECT p.suspended_reason FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (wallet_balance IS DISTINCT FROM (SELECT p.wallet_balance FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (loyalty_points IS DISTINCT FROM (SELECT p.loyalty_points FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (membership_tier IS DISTINCT FROM (SELECT p.membership_tier FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (membership_status IS DISTINCT FROM (SELECT p.membership_status FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (membership_expires_at IS DISTINCT FROM (SELECT p.membership_expires_at FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (membership_started_at IS DISTINCT FROM (SELECT p.membership_started_at FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (trial_tier IS DISTINCT FROM (SELECT p.trial_tier FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (trial_ends_at IS DISTINCT FROM (SELECT p.trial_ends_at FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (trial_started_at IS DISTINCT FROM (SELECT p.trial_started_at FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (trial_expired IS DISTINCT FROM (SELECT p.trial_expired FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (is_verified IS DISTINCT FROM (SELECT p.is_verified FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (account_status IS DISTINCT FROM (SELECT p.account_status FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (verification_level IS DISTINCT FROM (SELECT p.verification_level FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (verification_badge IS DISTINCT FROM (SELECT p.verification_badge FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (verified_at IS DISTINCT FROM (SELECT p.verified_at FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (email_verified IS DISTINCT FROM (SELECT p.email_verified FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (phone_verified IS DISTINCT FROM (SELECT p.phone_verified FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (global_awards IS DISTINCT FROM (SELECT p.global_awards FROM profiles p WHERE p.user_id = auth.uid()))
  );