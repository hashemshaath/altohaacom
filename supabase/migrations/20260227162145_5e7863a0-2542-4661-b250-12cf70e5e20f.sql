
-- Fix the overly permissive update policy for gift redemption
DROP POLICY "Recipients can redeem gifts" ON public.membership_gifts;

CREATE POLICY "Authenticated users can redeem pending gifts"
  ON public.membership_gifts FOR UPDATE
  USING (auth.uid() IS NOT NULL AND status = 'pending' AND expires_at > now())
  WITH CHECK (auth.uid() IS NOT NULL AND status IN ('pending', 'redeemed'));
