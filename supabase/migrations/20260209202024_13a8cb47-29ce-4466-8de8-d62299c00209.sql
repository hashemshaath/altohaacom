
-- ==============================================
-- 1. Competition number: SAYYYYMM0001
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
  v_month TEXT;
BEGIN
  v_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
  
  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.competitions
  WHERE country_code = UPPER(p_country_code)
    AND edition_year = p_year;

  RETURN UPPER(p_country_code) || p_year || v_month || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- ==============================================
-- 2. User Account: U00000001
-- ==============================================
CREATE OR REPLACE FUNCTION public.generate_account_number(p_role app_role)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_number INTEGER;
BEGIN
  -- Get and increment sequence
  UPDATE public.account_sequences
  SET last_number = last_number + 1
  WHERE role = p_role
  RETURNING last_number INTO v_number;

  -- All users get U prefix with 8-digit sequence
  RETURN 'U' || LPAD(v_number::TEXT, 8, '0');
END;
$$;

-- ==============================================
-- 3. Company Account: C00000001
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
  v_seq INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.companies
  WHERE company_number IS NOT NULL;

  RETURN 'C' || LPAD(v_seq::TEXT, 8, '0');
END;
$$;
