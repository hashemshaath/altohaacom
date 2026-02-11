
-- Invoice customization settings (singleton per company or global)
CREATE TABLE public.invoice_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Invoice Content
  invoice_title TEXT DEFAULT 'Invoice',
  invoice_title_ar TEXT DEFAULT 'فاتورة',
  title_style TEXT DEFAULT 'default' CHECK (title_style IN ('default', 'custom')),
  store_name_prefix TEXT DEFAULT 'E-commerce store',
  store_name_prefix_ar TEXT DEFAULT 'متجر إلكتروني',
  
  -- Product Information toggles
  show_product_image BOOLEAN DEFAULT true,
  show_product_description BOOLEAN DEFAULT true,
  show_gtin_code BOOLEAN DEFAULT false,
  show_mpn_code BOOLEAN DEFAULT false,
  show_product_weight BOOLEAN DEFAULT false,
  show_product_stock_number BOOLEAN DEFAULT false,
  show_product_barcode BOOLEAN DEFAULT false,
  
  -- Order and Invoice Information
  show_invoice_barcode BOOLEAN DEFAULT true,
  issue_english_copy BOOLEAN DEFAULT false,
  show_invoice_acknowledgment BOOLEAN DEFAULT false,
  show_order_note BOOLEAN DEFAULT true,
  show_return_policy BOOLEAN DEFAULT false,
  return_policy_text TEXT DEFAULT NULL,
  return_policy_text_ar TEXT DEFAULT NULL,
  
  -- Auto-send settings
  auto_send_invoice BOOLEAN DEFAULT false,
  auto_send_statuses TEXT[] DEFAULT ARRAY['paid'],
  
  -- Store and Contact Information
  show_store_address BOOLEAN DEFAULT true,
  show_contact_info BOOLEAN DEFAULT true,
  store_address TEXT DEFAULT NULL,
  store_address_ar TEXT DEFAULT NULL,
  contact_email TEXT DEFAULT NULL,
  contact_phone TEXT DEFAULT NULL,
  
  -- Design and Branding
  logo_url TEXT DEFAULT NULL,
  logo_size INTEGER DEFAULT 80 CHECK (logo_size >= 0 AND logo_size <= 100),
  logo_position TEXT DEFAULT 'right' CHECK (logo_position IN ('right', 'center', 'left')),
  main_font_weight TEXT DEFAULT 'bold' CHECK (main_font_weight IN ('bold', 'regular')),
  sub_font_weight TEXT DEFAULT 'regular' CHECK (sub_font_weight IN ('bold', 'regular')),
  primary_color TEXT DEFAULT '#10b981',
  watermark_url TEXT DEFAULT NULL,
  watermark_opacity INTEGER DEFAULT 30 CHECK (watermark_opacity >= 0 AND watermark_opacity <= 100),
  stamp_url TEXT DEFAULT NULL,
  stamp_opacity INTEGER DEFAULT 30 CHECK (stamp_opacity >= 0 AND stamp_opacity <= 100),
  stamp_position TEXT DEFAULT 'right' CHECK (stamp_position IN ('right', 'center', 'left')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id)
);

ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage all settings
CREATE POLICY "Admins can manage invoice settings"
  ON public.invoice_settings FOR ALL
  USING (public.is_admin(auth.uid()));

-- Company members can view their own settings
CREATE POLICY "Company members can view their invoice settings"
  ON public.invoice_settings FOR SELECT
  USING (
    company_id IS NULL 
    OR company_id IN (SELECT public.get_user_company_id(auth.uid()))
  );

-- Company members can update their own settings
CREATE POLICY "Company members can update their invoice settings"
  ON public.invoice_settings FOR UPDATE
  USING (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
  );

-- Company members can insert their own settings
CREATE POLICY "Company members can insert their invoice settings"
  ON public.invoice_settings FOR INSERT
  WITH CHECK (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
    OR public.is_admin(auth.uid())
  );

-- Insert default global settings
INSERT INTO public.invoice_settings (company_id) VALUES (NULL);
