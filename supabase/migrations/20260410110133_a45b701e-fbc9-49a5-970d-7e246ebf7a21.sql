
-- 1) competition_registrations: remove duplicate UPDATE without WITH CHECK
DROP POLICY IF EXISTS "Participants can update their registration" ON public.competition_registrations;
-- Keep "Participants can update their registrations" which has proper WITH CHECK

-- 2) membership_referrals: remove permissive INSERT, keep the one with referrer_id check
DROP POLICY IF EXISTS "Authenticated users create referrals" ON public.membership_referrals;

-- 3) user_wallets: restrict full management to super admin only
DROP POLICY IF EXISTS "Admins can manage all wallets" ON public.user_wallets;

CREATE POLICY "Super admins can manage all wallets"
ON public.user_wallets FOR ALL TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- 4) competition_scores: add admin read access
CREATE POLICY "Admins can view all scores"
ON public.competition_scores FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- 5) competition_roles: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Authenticated users can view competition roles" ON public.competition_roles;

CREATE POLICY "Authenticated users can view competition roles"
ON public.competition_roles FOR SELECT TO authenticated
USING (true);

-- 6) Add admin read for competition_registrations
CREATE POLICY "Admins can view all registrations"
ON public.competition_registrations FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- 7) Add admin manage for competition_registrations
CREATE POLICY "Admins can manage registrations"
ON public.competition_registrations FOR UPDATE TO authenticated
USING (is_admin(auth.uid()));
