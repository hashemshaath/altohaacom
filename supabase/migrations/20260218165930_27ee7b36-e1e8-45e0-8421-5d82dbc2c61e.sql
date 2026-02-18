
-- Add supplier-specific fields to companies
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS supplier_category text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tagline text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tagline_ar text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS founded_year integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_pro_supplier boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order integer DEFAULT NULL;

-- Create index for pro suppliers directory
CREATE INDEX IF NOT EXISTS idx_companies_pro_supplier ON public.companies (is_pro_supplier) WHERE is_pro_supplier = true;
CREATE INDEX IF NOT EXISTS idx_companies_supplier_category ON public.companies (supplier_category) WHERE supplier_category IS NOT NULL;

-- Allow public read access for active companies (for directory)
CREATE POLICY "Public can view active companies" ON public.companies
  FOR SELECT USING (status = 'active');
