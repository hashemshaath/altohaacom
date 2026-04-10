
-- Fix 1: Private group posts exposed via public visibility policy
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
CREATE POLICY "Public posts are viewable by everyone"
  ON public.posts
  FOR SELECT
  USING (
    visibility = 'public'
    AND moderation_status = 'approved'
    AND group_id IS NULL
  );

-- Fix 2: Protect verification fields from self-modification on profiles
-- First drop the existing UPDATE policy, then recreate with additional protected fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND membership_tier IS NOT DISTINCT FROM (SELECT membership_tier FROM public.profiles WHERE user_id = auth.uid())
    AND is_verified IS NOT DISTINCT FROM (SELECT is_verified FROM public.profiles WHERE user_id = auth.uid())
    AND account_status IS NOT DISTINCT FROM (SELECT account_status FROM public.profiles WHERE user_id = auth.uid())
    AND wallet_balance IS NOT DISTINCT FROM (SELECT wallet_balance FROM public.profiles WHERE user_id = auth.uid())
    AND loyalty_points IS NOT DISTINCT FROM (SELECT loyalty_points FROM public.profiles WHERE user_id = auth.uid())
    AND verification_level IS NOT DISTINCT FROM (SELECT verification_level FROM public.profiles WHERE user_id = auth.uid())
    AND verification_badge IS NOT DISTINCT FROM (SELECT verification_badge FROM public.profiles WHERE user_id = auth.uid())
    AND verified_at IS NOT DISTINCT FROM (SELECT verified_at FROM public.profiles WHERE user_id = auth.uid())
  );
