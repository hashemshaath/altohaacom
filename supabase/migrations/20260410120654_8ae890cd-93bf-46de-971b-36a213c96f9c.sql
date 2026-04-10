
-- 1) CRITICAL: protect trial & membership fields from self-modification
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Protect email & identity fields
  AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid())
  AND secondary_email IS NOT DISTINCT FROM (SELECT p.secondary_email FROM public.profiles p WHERE p.user_id = auth.uid())
  AND account_type IS NOT DISTINCT FROM (SELECT p.account_type FROM public.profiles p WHERE p.user_id = auth.uid())
  AND company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
  AND company_role IS NOT DISTINCT FROM (SELECT p.company_role FROM public.profiles p WHERE p.user_id = auth.uid())
  -- Protect suspension fields
  AND suspended_at IS NOT DISTINCT FROM (SELECT p.suspended_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND suspended_reason IS NOT DISTINCT FROM (SELECT p.suspended_reason FROM public.profiles p WHERE p.user_id = auth.uid())
  -- Protect financial fields
  AND wallet_balance IS NOT DISTINCT FROM (SELECT p.wallet_balance FROM public.profiles p WHERE p.user_id = auth.uid())
  AND loyalty_points IS NOT DISTINCT FROM (SELECT p.loyalty_points FROM public.profiles p WHERE p.user_id = auth.uid())
  -- Protect membership fields
  AND membership_tier IS NOT DISTINCT FROM (SELECT p.membership_tier FROM public.profiles p WHERE p.user_id = auth.uid())
  AND membership_status IS NOT DISTINCT FROM (SELECT p.membership_status FROM public.profiles p WHERE p.user_id = auth.uid())
  AND membership_expires_at IS NOT DISTINCT FROM (SELECT p.membership_expires_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND membership_started_at IS NOT DISTINCT FROM (SELECT p.membership_started_at FROM public.profiles p WHERE p.user_id = auth.uid())
  -- Protect trial fields
  AND trial_tier IS NOT DISTINCT FROM (SELECT p.trial_tier FROM public.profiles p WHERE p.user_id = auth.uid())
  AND trial_ends_at IS NOT DISTINCT FROM (SELECT p.trial_ends_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND trial_started_at IS NOT DISTINCT FROM (SELECT p.trial_started_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND trial_expired IS NOT DISTINCT FROM (SELECT p.trial_expired FROM public.profiles p WHERE p.user_id = auth.uid())
  -- Protect verification fields
  AND is_verified IS NOT DISTINCT FROM (SELECT p.is_verified FROM public.profiles p WHERE p.user_id = auth.uid())
  AND account_status IS NOT DISTINCT FROM (SELECT p.account_status FROM public.profiles p WHERE p.user_id = auth.uid())
  AND verification_level IS NOT DISTINCT FROM (SELECT p.verification_level FROM public.profiles p WHERE p.user_id = auth.uid())
  AND verification_badge IS NOT DISTINCT FROM (SELECT p.verification_badge FROM public.profiles p WHERE p.user_id = auth.uid())
  AND verified_at IS NOT DISTINCT FROM (SELECT p.verified_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND email_verified IS NOT DISTINCT FROM (SELECT p.email_verified FROM public.profiles p WHERE p.user_id = auth.uid())
  AND phone_verified IS NOT DISTINCT FROM (SELECT p.phone_verified FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2) chef_schedule_events: hide sensitive fields from non-owners
REVOKE SELECT (fee_amount, fee_currency, is_contracted, contract_status, internal_notes) ON public.chef_schedule_events FROM authenticated;

-- Create safe accessor for event owners/admins
CREATE OR REPLACE FUNCTION public.get_chef_event_financials(p_event_id uuid)
RETURNS TABLE(fee_amount numeric, fee_currency text, is_contracted boolean, contract_status text, internal_notes text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.fee_amount, e.fee_currency, e.is_contracted, e.contract_status, e.internal_notes
  FROM public.chef_schedule_events e
  WHERE e.id = p_event_id
  AND (
    e.chef_id = auth.uid()
    OR is_admin(auth.uid())
  );
$$;
