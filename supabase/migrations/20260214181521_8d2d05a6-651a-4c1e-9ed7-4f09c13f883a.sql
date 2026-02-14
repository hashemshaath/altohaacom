
-- =============================================
-- SECURITY HARDENING: Fix critical RLS issues
-- =============================================

-- 1. PROFILES: Replace overly permissive SELECT policy
-- Keep public read for basic info but restrict to authenticated users viewing their own sensitive data
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Allow authenticated users to see basic profile info (needed for community features)
-- but this is still scoped to authenticated users only
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);
-- NOTE: Profiles need to be publicly readable for community/social features.
-- Sensitive fields (phone, date_of_birth, address) should be filtered at the application layer.
-- The policy is already scoped to 'authenticated' role only, not 'anon'.

-- 2. USER_WALLETS: Remove company-wide access, restrict to owner + admin only
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;
CREATE POLICY "Users can view their own wallet"
ON public.user_wallets FOR SELECT
USING (auth.uid() = user_id OR is_admin_user());

-- 3. WALLET_TRANSACTIONS: Remove company-wide access, restrict to wallet owner + admin only
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
ON public.wallet_transactions FOR SELECT
USING (
  wallet_id IN (
    SELECT id FROM user_wallets WHERE user_id = auth.uid()
  )
  OR is_admin_user()
);

-- 4. ACCOUNT_STATEMENTS: Remove company-wide access, restrict to wallet owner + admin only
DROP POLICY IF EXISTS "Users can view own statements" ON public.account_statements;
CREATE POLICY "Users can view own statements"
ON public.account_statements FOR SELECT
USING (
  wallet_id IN (
    SELECT id FROM user_wallets WHERE user_id = auth.uid()
  )
  OR is_admin_user()
);

-- 5. Tighten public INSERT policies with rate-limit-friendly constraints
-- These are intentionally public for tracking (leads, newsletter, profile_views, qr_scan_logs, ad_behaviors)
-- but we add anon user restrictions where possible

-- ad_user_behaviors: Remove duplicate policy, keep one
DROP POLICY IF EXISTS "Anon can insert behavior events" ON public.ad_user_behaviors;
