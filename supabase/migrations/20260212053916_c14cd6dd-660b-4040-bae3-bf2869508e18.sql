
-- Company Classifications table for custom categories beyond predefined roles
CREATE TABLE public.company_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  color TEXT DEFAULT 'bg-primary/10 text-primary border-primary/20',
  icon TEXT DEFAULT 'tag',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.company_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view classifications" ON public.company_classifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage classifications" ON public.company_classifications FOR ALL USING (is_admin(auth.uid()));

-- Seed system classifications from existing roles
INSERT INTO public.company_classifications (name, name_ar, color, icon, is_system, sort_order) VALUES
  ('Sponsor', 'راعي', 'bg-chart-4/10 text-chart-4 border-chart-4/20', 'crown', true, 1),
  ('Supplier', 'مورد', 'bg-primary/10 text-primary border-primary/20', 'package', true, 2),
  ('Partner', 'شريك', 'bg-chart-3/10 text-chart-3 border-chart-3/20', 'handshake', true, 3),
  ('Vendor', 'بائع', 'bg-chart-5/10 text-chart-5 border-chart-5/20', 'store', true, 4),
  ('Media', 'إعلام', 'bg-chart-1/10 text-chart-1 border-chart-1/20', 'radio', true, 5),
  ('Logistics', 'لوجستيات', 'bg-chart-2/10 text-chart-2 border-chart-2/20', 'truck', true, 6);

-- Add shop_product_id to company_catalog to link catalog items to shop
ALTER TABLE public.company_catalog ADD COLUMN IF NOT EXISTS shop_product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL;

-- Add company_media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('company-media', 'company-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public company media readable" ON storage.objects FOR SELECT USING (bucket_id = 'company-media');
CREATE POLICY "Admins can manage company media" ON storage.objects FOR ALL USING (bucket_id = 'company-media' AND is_admin(auth.uid()));
