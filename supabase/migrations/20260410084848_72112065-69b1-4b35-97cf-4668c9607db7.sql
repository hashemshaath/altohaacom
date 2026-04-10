-- 1. FIX: Add email_verified and phone_verified to protected fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (membership_tier IS DISTINCT FROM (SELECT p.membership_tier FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (is_verified IS DISTINCT FROM (SELECT p.is_verified FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (account_status IS DISTINCT FROM (SELECT p.account_status FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (wallet_balance IS DISTINCT FROM (SELECT p.wallet_balance FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (loyalty_points IS DISTINCT FROM (SELECT p.loyalty_points FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (verification_level IS DISTINCT FROM (SELECT p.verification_level FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (verification_badge IS DISTINCT FROM (SELECT p.verification_badge FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (verified_at IS DISTINCT FROM (SELECT p.verified_at FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (email_verified IS DISTINCT FROM (SELECT p.email_verified FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (phone_verified IS DISTINCT FROM (SELECT p.phone_verified FROM profiles p WHERE p.user_id = auth.uid()))
  );

-- 2. FIX: company_catalog - restrict write ops to manager/admin/owner roles
DROP POLICY IF EXISTS "Company users can manage catalog" ON public.company_catalog;

CREATE POLICY "Company users can view catalog"
  ON public.company_catalog FOR SELECT
  USING (
    company_id IN (
      SELECT cc.company_id FROM company_contacts cc WHERE cc.user_id = auth.uid()
    )
  );

CREATE POLICY "Company managers can manage catalog"
  ON public.company_catalog FOR ALL
  USING (
    company_id IN (
      SELECT cc.company_id FROM company_contacts cc 
      WHERE cc.user_id = auth.uid() 
        AND cc.role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT cc.company_id FROM company_contacts cc 
      WHERE cc.user_id = auth.uid() 
        AND cc.role IN ('owner', 'admin', 'manager')
    )
  );

-- 3. FIX: lifecycle_triggers - restrict to admins only
DROP POLICY IF EXISTS "Anyone can read active triggers" ON public.lifecycle_triggers;

CREATE POLICY "Admins can read triggers"
  ON public.lifecycle_triggers FOR SELECT
  TO authenticated
  USING (is_admin_user());
