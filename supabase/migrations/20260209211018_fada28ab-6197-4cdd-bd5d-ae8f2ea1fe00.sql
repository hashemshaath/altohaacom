
-- Product categories enum
CREATE TYPE public.shop_product_type AS ENUM ('physical', 'digital', 'service');
CREATE TYPE public.shop_order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- Shop products table
CREATE TABLE public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  product_type shop_product_type NOT NULL DEFAULT 'physical',
  category TEXT NOT NULL DEFAULT 'general',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT,
  gallery_urls TEXT[],
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Anyone can view active products" ON public.shop_products
  FOR SELECT USING (is_active = true);

-- Sellers can manage their own products
CREATE POLICY "Sellers can insert own products" ON public.shop_products
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products" ON public.shop_products
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products" ON public.shop_products
  FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- Admins can manage all products
CREATE POLICY "Admins can manage all products" ON public.shop_products
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Shop orders table
CREATE TABLE public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL,
  status shop_order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders" ON public.shop_orders
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);

-- Buyers can create orders
CREATE POLICY "Buyers can create orders" ON public.shop_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders" ON public.shop_orders
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Shop order items table
CREATE TABLE public.shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shop_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_snapshot JSONB
);

ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own order items (via order)
CREATE POLICY "Buyers can view own order items" ON public.shop_order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.shop_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

-- Buyers can insert order items for own orders
CREATE POLICY "Buyers can insert own order items" ON public.shop_order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.shop_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

-- Admins can manage all order items
CREATE POLICY "Admins can manage all order items" ON public.shop_order_items
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Sellers can view order items for their products
CREATE POLICY "Sellers can view order items for own products" ON public.shop_order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.shop_products WHERE id = product_id AND seller_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_orders_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Order number generator
CREATE OR REPLACE FUNCTION public.generate_shop_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_date TEXT;
  v_count INTEGER;
BEGIN
  v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_count
  FROM shop_orders
  WHERE created_at::date = CURRENT_DATE;
  RETURN 'SHP' || v_date || LPAD(v_count::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_set_shop_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_shop_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_shop_order_number
  BEFORE INSERT ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_shop_order_number();

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view shop images" ON storage.objects
  FOR SELECT USING (bucket_id = 'shop-images');

CREATE POLICY "Authenticated users can upload shop images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-images');

CREATE POLICY "Users can update own shop images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'shop-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own shop images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'shop-images' AND auth.uid()::text = (storage.foldername(name))[1]);
