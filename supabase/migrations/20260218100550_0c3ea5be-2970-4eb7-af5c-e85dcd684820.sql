
-- ============================================================
-- UNIFIED COST CENTER: cross-module cost estimation, pricing & approvals
-- Serves: competitions, chef's table, projects, events, etc.
-- ============================================================

-- Cost estimate type enum
CREATE TYPE public.cost_module_type AS ENUM (
  'competition', 'chefs_table', 'exhibition', 'event', 'project', 'other'
);

CREATE TYPE public.cost_estimate_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'rejected', 'invoiced', 'cancelled'
);

CREATE TYPE public.cost_item_category AS ENUM (
  'personnel', 'equipment', 'venue', 'travel', 'accommodation', 'catering',
  'materials', 'logistics', 'marketing', 'insurance', 'permits', 'miscellaneous'
);

-- ─── 1. Cost Estimates (main header) ─────────────────────
CREATE TABLE public.cost_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_number TEXT NOT NULL DEFAULT '',
  
  -- Cross-module references (polymorphic)
  module_type public.cost_module_type NOT NULL,
  module_id UUID NULL,              -- FK to competition/session/exhibition
  module_title TEXT NULL,           -- Human-readable reference
  module_title_ar TEXT NULL,
  
  -- Company/Client
  company_id UUID REFERENCES public.companies(id) NULL,
  
  -- Estimate details
  title TEXT NOT NULL,
  title_ar TEXT NULL,
  description TEXT NULL,
  description_ar TEXT NULL,
  
  -- Financial
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 15,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  
  -- Status & Approval
  status public.cost_estimate_status NOT NULL DEFAULT 'draft',
  prepared_by UUID NULL,
  approved_by UUID NULL,
  approved_at TIMESTAMPTZ NULL,
  rejection_reason TEXT NULL,
  valid_until DATE NULL,
  
  -- Linked invoice
  invoice_id UUID REFERENCES public.invoices(id) NULL,
  
  -- Notes
  notes TEXT NULL,
  notes_ar TEXT NULL,
  internal_notes TEXT NULL,
  
  -- Metadata
  version INTEGER NOT NULL DEFAULT 1,
  parent_estimate_id UUID REFERENCES public.cost_estimates(id) NULL,
  tags TEXT[] NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate estimate number
CREATE SEQUENCE IF NOT EXISTS public.cost_estimate_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_cost_estimate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seq INTEGER;
  v_year TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_seq := nextval('public.cost_estimate_seq');
  RETURN 'CE-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_assign_estimate_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.estimate_number IS NULL OR NEW.estimate_number = '' THEN
    NEW.estimate_number := public.generate_cost_estimate_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_estimate_number
  BEFORE INSERT ON public.cost_estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_assign_estimate_number();

CREATE TRIGGER update_cost_estimates_updated_at
  BEFORE UPDATE ON public.cost_estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 2. Cost Estimate Items (line items) ─────────────────
CREATE TABLE public.cost_estimate_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.cost_estimates(id) ON DELETE CASCADE,
  
  category public.cost_item_category NOT NULL DEFAULT 'miscellaneous',
  
  -- Item details
  title TEXT NOT NULL,
  title_ar TEXT NULL,
  description TEXT NULL,
  description_ar TEXT NULL,
  
  -- Quantity & pricing
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NULL,                    -- 'person', 'day', 'piece', 'hour', etc.
  unit_ar TEXT NULL,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  
  -- Optional personnel reference
  person_id UUID NULL,              -- Reference to a chef/judge/staff profile
  person_role TEXT NULL,
  
  -- Optional reference to cost profile for auto-pricing
  cost_profile_id UUID REFERENCES public.chef_cost_profiles(id) NULL,
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. Cost Approval Log ────────────────────────────────
CREATE TABLE public.cost_approval_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.cost_estimates(id) ON DELETE CASCADE,
  action TEXT NOT NULL,               -- 'submitted', 'approved', 'rejected', 'revised', 'invoiced'
  performed_by UUID NOT NULL,
  comments TEXT NULL,
  comments_ar TEXT NULL,
  previous_status TEXT NULL,
  new_status TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. Operational Cost Templates ──────────────────────
CREATE TABLE public.cost_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NULL,
  description TEXT NULL,
  description_ar TEXT NULL,
  module_type public.cost_module_type NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each item: { category, title, title_ar, unit, unit_price, default_quantity }
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_cost_templates_updated_at
  BEFORE UPDATE ON public.cost_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ─── RLS Policies ────────────────────────────────────────
ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_approval_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_templates ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins full access to cost_estimates"
  ON public.cost_estimates FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to cost_estimate_items"
  ON public.cost_estimate_items FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to cost_approval_log"
  ON public.cost_approval_log FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to cost_templates"
  ON public.cost_templates FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Company users can view their own estimates
CREATE POLICY "Company users view own estimates"
  ON public.cost_estimates FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
  );

-- Add indexes
CREATE INDEX idx_cost_estimates_module ON public.cost_estimates(module_type, module_id);
CREATE INDEX idx_cost_estimates_status ON public.cost_estimates(status);
CREATE INDEX idx_cost_estimates_company ON public.cost_estimates(company_id);
CREATE INDEX idx_cost_estimate_items_estimate ON public.cost_estimate_items(estimate_id);
CREATE INDEX idx_cost_approval_log_estimate ON public.cost_approval_log(estimate_id);
