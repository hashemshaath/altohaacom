
-- ==============================================
-- 1. Order number: ORD00000001
-- ==============================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM company_orders;

  RETURN 'ORD' || LPAD(v_count::TEXT, 8, '0');
END;
$$;

-- ==============================================
-- 2. Transaction number: TXN00000001
-- ==============================================
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM company_transactions;

  RETURN 'TXN' || LPAD(v_count::TEXT, 8, '0');
END;
$$;

-- ==============================================
-- 3. Invoice number: INV00000001
-- ==============================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices;

  RETURN 'INV' || LPAD(v_count::TEXT, 8, '0');
END;
$$;

-- ==============================================
-- 4. Certificate number: CRT00000001
-- ==============================================
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM certificates;

  RETURN 'CRT' || LPAD(v_count::TEXT, 8, '0');
END;
$$;

-- ==============================================
-- 5. Registration number: REG00000001
--    Add auto-assign trigger for registrations
-- ==============================================
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM competition_registrations;

  RETURN 'REG' || LPAD(v_count::TEXT, 8, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_registration_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.registration_number IS NULL THEN
    NEW.registration_number := public.generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_registration_number
  BEFORE INSERT ON public.competition_registrations
  FOR EACH ROW EXECUTE FUNCTION public.assign_registration_number();
