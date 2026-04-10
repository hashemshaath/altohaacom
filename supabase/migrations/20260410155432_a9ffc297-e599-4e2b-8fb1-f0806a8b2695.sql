
-- 1. email_verifications: owner-only SELECT
CREATE POLICY "Users can view own email verifications"
ON public.email_verifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2. phone_verifications: owner-only SELECT
CREATE POLICY "Users can view own phone verifications"
ON public.phone_verifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. password_recovery_tokens: owner-only SELECT
CREATE POLICY "Users can view own recovery tokens"
ON public.password_recovery_tokens FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 4. user_pins: remove admin read of hashed PINs
DROP POLICY IF EXISTS "Admins can view PINs" ON public.user_pins;

-- 5. judge_profiles: restrict sensitive PII to super admin only
-- Drop existing admin SELECT and replace with tiered access
DROP POLICY IF EXISTS "Admins can view all judge profiles" ON public.judge_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.judge_profiles;

-- Owner sees own full profile
DROP POLICY IF EXISTS "Judges can view own profile" ON public.judge_profiles;
CREATE POLICY "Judges can view own profile"
ON public.judge_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Super admin (supervisor) sees all
CREATE POLICY "Super admin can view all judge profiles"
ON public.judge_profiles FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));
