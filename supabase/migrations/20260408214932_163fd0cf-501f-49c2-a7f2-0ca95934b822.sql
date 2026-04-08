-- Extend company_catalog with new professional fields
ALTER TABLE public.company_catalog
  ADD COLUMN IF NOT EXISTS warranty_years integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_discount_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coupon_discount_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT NULL;

-- Product Q&A table
CREATE TABLE public.product_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id uuid NOT NULL REFERENCES public.company_catalog(id) ON DELETE CASCADE,
  question text NOT NULL,
  question_ar text,
  answer text,
  answer_ar text,
  answered_by text DEFAULT NULL,
  answered_by_ar text DEFAULT NULL,
  asked_by uuid DEFAULT NULL,
  is_visible boolean DEFAULT true,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible Q&A" ON public.product_qa
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Authenticated users can ask questions" ON public.product_qa
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can manage Q&A" ON public.product_qa
  FOR ALL USING (public.is_admin(auth.uid()));

-- Product trust badges table
CREATE TABLE public.product_trust_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.company_catalog(id) ON DELETE CASCADE,
  badge_type text NOT NULL DEFAULT 'custom',
  label text NOT NULL,
  label_ar text,
  icon_name text DEFAULT 'ShieldCheck',
  color_class text DEFAULT 'text-primary',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_trust_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active trust badges" ON public.product_trust_badges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Supervisors can manage trust badges" ON public.product_trust_badges
  FOR ALL USING (public.is_admin(auth.uid()));

-- Trigger for product_qa updated_at
CREATE TRIGGER update_product_qa_updated_at
  BEFORE UPDATE ON public.product_qa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
