
-- Add discount and tax fields to shop_products
ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brand_ar TEXT DEFAULT NULL;

-- Add tax/discount/payment fields to shop_orders
ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS buyer_email TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS buyer_name TEXT DEFAULT NULL;

-- Create shop_categories table for organized categories
CREATE TABLE IF NOT EXISTS public.shop_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop categories are publicly readable"
  ON public.shop_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage shop categories"
  ON public.shop_categories FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create shop_discount_codes table
CREATE TABLE IF NOT EXISTS public.shop_discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.shop_discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discount codes readable by authenticated"
  ON public.shop_discount_codes FOR SELECT
  TO authenticated USING (is_active = true);

CREATE POLICY "Admins manage discount codes"
  ON public.shop_discount_codes FOR ALL
  USING (public.is_admin(auth.uid()));
