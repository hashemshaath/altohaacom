
-- Customer wallet for CRM
CREATE TABLE IF NOT EXISTS public.customer_wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'credit' CHECK (type IN ('credit', 'debit', 'refund', 'reward', 'adjustment')),
  amount DECIMAL NOT NULL DEFAULT 0,
  balance_after DECIMAL NOT NULL DEFAULT 0,
  description TEXT,
  description_ar TEXT,
  reference_type TEXT,
  reference_id TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wallet transactions"
  ON public.customer_wallet_transactions FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own wallet"
  ON public.customer_wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Loyalty points
CREATE TABLE IF NOT EXISTS public.customer_loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'earn' CHECK (type IN ('earn', 'redeem', 'expire', 'bonus', 'adjustment')),
  description TEXT,
  description_ar TEXT,
  reference_type TEXT,
  reference_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage loyalty points"
  ON public.customer_loyalty_points FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own loyalty points"
  ON public.customer_loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

-- Wishlist
CREATE TABLE IF NOT EXISTS public.customer_wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'product',
  item_id UUID NOT NULL,
  item_name TEXT,
  item_name_ar TEXT,
  item_image_url TEXT,
  item_price DECIMAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE public.customer_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wishlists"
  ON public.customer_wishlist FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can manage own wishlist"
  ON public.customer_wishlist FOR ALL
  USING (auth.uid() = user_id);

-- Customer groups
CREATE TABLE IF NOT EXISTS public.customer_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customer groups"
  ON public.customer_groups FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read customer groups"
  ON public.customer_groups FOR SELECT
  USING (true);

-- Customer group memberships
CREATE TABLE IF NOT EXISTS public.customer_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.customer_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.customer_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group members"
  ON public.customer_group_members FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can see own groups"
  ON public.customer_group_members FOR SELECT
  USING (auth.uid() = user_id);

-- Custom fields for customers
CREATE TABLE IF NOT EXISTS public.customer_custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, field_name)
);

ALTER TABLE public.customer_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage custom fields"
  ON public.customer_custom_fields FOR ALL
  USING (public.is_admin(auth.uid()));

-- Add wallet_balance and loyalty_points columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
