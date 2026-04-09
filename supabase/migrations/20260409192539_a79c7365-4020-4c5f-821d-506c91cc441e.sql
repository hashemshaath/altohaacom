
-- 1. Fix profiles UPDATE: block users from modifying privileged columns
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND membership_tier IS NOT DISTINCT FROM (SELECT p.membership_tier FROM public.profiles p WHERE p.user_id = auth.uid())
  AND is_verified IS NOT DISTINCT FROM (SELECT p.is_verified FROM public.profiles p WHERE p.user_id = auth.uid())
  AND account_type IS NOT DISTINCT FROM (SELECT p.account_type FROM public.profiles p WHERE p.user_id = auth.uid())
  AND account_status IS NOT DISTINCT FROM (SELECT p.account_status FROM public.profiles p WHERE p.user_id = auth.uid())
  AND wallet_balance IS NOT DISTINCT FROM (SELECT p.wallet_balance FROM public.profiles p WHERE p.user_id = auth.uid())
  AND loyalty_points IS NOT DISTINCT FROM (SELECT p.loyalty_points FROM public.profiles p WHERE p.user_id = auth.uid())
  AND loyalty_tier IS NOT DISTINCT FROM (SELECT p.loyalty_tier FROM public.profiles p WHERE p.user_id = auth.uid())
  AND trial_expired IS NOT DISTINCT FROM (SELECT p.trial_expired FROM public.profiles p WHERE p.user_id = auth.uid())
  AND trial_tier IS NOT DISTINCT FROM (SELECT p.trial_tier FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2. Fix exhibition_discount_codes: remove public read
DROP POLICY IF EXISTS "Anyone can view active discount codes" ON public.exhibition_discount_codes;

CREATE POLICY "Authenticated view discount codes"
ON public.exhibition_discount_codes FOR SELECT
TO authenticated
USING (
  is_admin_user()
  OR is_exhibition_organizer(exhibition_id)
  OR (EXISTS (
    SELECT 1 FROM exhibitions
    WHERE exhibitions.id = exhibition_discount_codes.exhibition_id
    AND exhibitions.created_by = auth.uid()
  ))
);

-- 3. Fix exhibition_invites: remove public read
DROP POLICY IF EXISTS "Anyone can view active invites" ON public.exhibition_invites;

CREATE POLICY "Users view own or admin invites"
ON public.exhibition_invites FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR is_admin_user()
);

-- 4. Fix shop_discount_codes: restrict listing to admins
DROP POLICY IF EXISTS "Discount codes readable by authenticated" ON public.shop_discount_codes;

CREATE POLICY "Only admins can list shop discount codes"
ON public.shop_discount_codes FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));
