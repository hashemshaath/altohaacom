
-- Membership referral tracking
CREATE TABLE public.membership_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'pending',
  referrer_bonus_points INTEGER DEFAULT 0,
  referred_bonus_points INTEGER DEFAULT 0,
  referrer_discount_percent NUMERIC DEFAULT 0,
  referred_discount_percent NUMERIC DEFAULT 0,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_membership_referral UNIQUE (referrer_id, referred_id)
);

ALTER TABLE public.membership_referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals (sent or received)
CREATE POLICY "Users view own referrals" ON public.membership_referrals
FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Authenticated users can create referrals
CREATE POLICY "Authenticated users create referrals" ON public.membership_referrals
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can manage all
CREATE POLICY "Admins manage referrals" ON public.membership_referrals
FOR ALL USING (public.is_admin_user());
