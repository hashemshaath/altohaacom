
-- ==============================================
-- 1. Competition Series table (groups editions)
-- ==============================================
CREATE TABLE public.competition_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  logo_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competition_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view series" ON public.competition_series
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage series" ON public.competition_series
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_competition_series_updated_at
  BEFORE UPDATE ON public.competition_series
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 2. Add fields to competitions
-- ==============================================
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS competition_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS country_code CHAR(2),
  ADD COLUMN IF NOT EXISTS edition_year INTEGER,
  ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.competition_series(id) ON DELETE SET NULL;

CREATE INDEX idx_competitions_series ON public.competitions(series_id);
CREATE INDEX idx_competitions_country_year ON public.competitions(country_code, edition_year);

-- ==============================================
-- 3. Add company_number to companies
-- ==============================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS company_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS country_code CHAR(2);

CREATE INDEX idx_companies_country ON public.companies(country_code);

-- ==============================================
-- 4. Competition number generator
--    Format: SA-2026-COMP-001
-- ==============================================
CREATE OR REPLACE FUNCTION public.generate_competition_number(
  p_country_code CHAR(2),
  p_year INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.competitions
  WHERE country_code = UPPER(p_country_code)
    AND edition_year = p_year;

  RETURN UPPER(p_country_code) || '-' || p_year || '-COMP-' || LPAD(v_seq::TEXT, 3, '0');
END;
$$;

-- ==============================================
-- 5. Company number generator
--    Format: SA-S000001
-- ==============================================
CREATE OR REPLACE FUNCTION public.generate_company_number(
  p_country_code CHAR(2),
  p_company_type company_type
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix CHAR(1);
  v_seq INTEGER;
BEGIN
  CASE p_company_type
    WHEN 'supplier' THEN v_prefix := 'S';
    WHEN 'sponsor' THEN v_prefix := 'P';
    WHEN 'partner' THEN v_prefix := 'P';
    WHEN 'vendor' THEN v_prefix := 'V';
    ELSE v_prefix := 'C';
  END CASE;

  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.companies
  WHERE country_code = UPPER(p_country_code)
    AND type = p_company_type;

  RETURN UPPER(p_country_code) || '-' || v_prefix || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

-- ==============================================
-- 6. Auto-assign company_number on insert
-- ==============================================
CREATE OR REPLACE FUNCTION public.assign_company_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.company_number IS NULL AND NEW.country_code IS NOT NULL THEN
    NEW.company_number := public.generate_company_number(NEW.country_code, NEW.type);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_company_number
  BEFORE INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.assign_company_number();

-- ==============================================
-- 7. Unique constraint: one series edition per country per year
-- ==============================================
CREATE UNIQUE INDEX idx_unique_series_country_year 
  ON public.competitions(series_id, country_code, edition_year) 
  WHERE series_id IS NOT NULL;
