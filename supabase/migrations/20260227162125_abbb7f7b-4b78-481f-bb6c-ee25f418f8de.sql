
-- Membership gifts table
CREATE TABLE public.membership_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_code TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 10)),
  sender_id UUID NOT NULL,
  recipient_id UUID,
  recipient_email TEXT,
  recipient_name TEXT,
  tier TEXT NOT NULL DEFAULT 'professional',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  duration_months INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  message TEXT,
  message_ar TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_reference TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_membership_gifts_sender ON public.membership_gifts(sender_id);
CREATE INDEX idx_membership_gifts_recipient ON public.membership_gifts(recipient_id);
CREATE INDEX idx_membership_gifts_code ON public.membership_gifts(gift_code);
CREATE INDEX idx_membership_gifts_status ON public.membership_gifts(status);

-- Enable RLS
ALTER TABLE public.membership_gifts ENABLE ROW LEVEL SECURITY;

-- Sender can view their sent gifts
CREATE POLICY "Users can view their sent gifts"
  ON public.membership_gifts FOR SELECT
  USING (auth.uid() = sender_id);

-- Recipients can view gifts sent to them
CREATE POLICY "Recipients can view their received gifts"
  ON public.membership_gifts FOR SELECT
  USING (auth.uid() = recipient_id OR auth.uid() = redeemed_by);

-- Anyone can view a gift by code (for redemption)
CREATE POLICY "Anyone can view gift by code"
  ON public.membership_gifts FOR SELECT
  USING (true);

-- Users can create gifts
CREATE POLICY "Users can create gifts"
  ON public.membership_gifts FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update their own gifts (cancel)
CREATE POLICY "Senders can update their gifts"
  ON public.membership_gifts FOR UPDATE
  USING (auth.uid() = sender_id);

-- Recipients can redeem (update redeemed fields)
CREATE POLICY "Recipients can redeem gifts"
  ON public.membership_gifts FOR UPDATE
  USING (status = 'pending' AND expires_at > now());

-- Admins can manage all gifts
CREATE POLICY "Admins can manage all gifts"
  ON public.membership_gifts FOR ALL
  USING (public.is_admin_user());
