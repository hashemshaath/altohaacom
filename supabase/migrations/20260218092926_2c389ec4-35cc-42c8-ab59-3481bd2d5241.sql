
-- Evaluation pricing configuration
CREATE TABLE public.evaluation_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  base_fee NUMERIC NOT NULL DEFAULT 500,
  per_chef_fee NUMERIC NOT NULL DEFAULT 200,
  currency TEXT NOT NULL DEFAULT 'SAR',
  product_category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage evaluation pricing" ON public.evaluation_pricing
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active pricing" ON public.evaluation_pricing
  FOR SELECT USING (is_active = true);

-- Chef evaluation registration (chefs register interest)
CREATE TABLE public.chef_evaluation_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID NOT NULL,
  session_id UUID,
  specialties TEXT[] DEFAULT '{}',
  availability_start DATE,
  availability_end DATE,
  preferred_city TEXT,
  preferred_country_code TEXT,
  experience_years INTEGER,
  motivation TEXT,
  motivation_ar TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  matched_at TIMESTAMPTZ,
  matched_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chef_evaluation_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chefs manage own registrations" ON public.chef_evaluation_registrations
  FOR ALL USING (auth.uid() = chef_id);

CREATE POLICY "Admins manage all registrations" ON public.chef_evaluation_registrations
  FOR ALL USING (public.is_admin(auth.uid()));

-- Add session_id reference to invoices for linking
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS session_id UUID;

-- Add pricing_id to sessions
ALTER TABLE public.chefs_table_sessions ADD COLUMN IF NOT EXISTS pricing_id UUID;
ALTER TABLE public.chefs_table_sessions ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
ALTER TABLE public.chefs_table_sessions ADD COLUMN IF NOT EXISTS invoice_id UUID;
ALTER TABLE public.chefs_table_sessions ADD COLUMN IF NOT EXISTS report_token TEXT;
ALTER TABLE public.chefs_table_sessions ADD COLUMN IF NOT EXISTS report_published BOOLEAN DEFAULT false;
ALTER TABLE public.chefs_table_sessions ADD COLUMN IF NOT EXISTS report_published_at TIMESTAMPTZ;

-- Add template_id to sessions
ALTER TABLE public.chefs_table_sessions ADD COLUMN IF NOT EXISTS template_id UUID;

-- Generate a unique report token for public sharing
CREATE OR REPLACE FUNCTION public.generate_report_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 12));
END;
$$;

-- Auto-assign report token on session creation
CREATE OR REPLACE FUNCTION public.auto_assign_report_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.report_token IS NULL THEN
    NEW.report_token := public.generate_report_token();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_report_token
  BEFORE INSERT ON public.chefs_table_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_report_token();
