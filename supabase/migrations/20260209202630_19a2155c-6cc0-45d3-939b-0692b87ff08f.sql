
-- 1. Order: ORDYYYYMMDD000001
CREATE OR REPLACE FUNCTION public.generate_order_number()
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
  FROM company_orders
  WHERE created_at::date = CURRENT_DATE;
  RETURN 'ORD' || v_date || LPAD(v_count::TEXT, 6, '0');
END;
$$;

-- 2. Transaction: TXNYYYYMMDD000001
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
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
  FROM company_transactions
  WHERE created_at::date = CURRENT_DATE;
  RETURN 'TXN' || v_date || LPAD(v_count::TEXT, 6, '0');
END;
$$;

-- 3. Invoice: INVYYYYMMDD000001
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
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
  FROM invoices
  WHERE created_at::date = CURRENT_DATE;
  RETURN 'INV' || v_date || LPAD(v_count::TEXT, 6, '0');
END;
$$;

-- 4. Certificate: CRTYYYYMM000001
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month TEXT;
  v_count INTEGER;
BEGIN
  v_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  SELECT COUNT(*) + 1 INTO v_count
  FROM certificates
  WHERE TO_CHAR(created_at, 'YYYYMM') = v_month;
  RETURN 'CRT' || v_month || LPAD(v_count::TEXT, 6, '0');
END;
$$;

-- 5. Registration: REGYYYYMMDD000001
CREATE OR REPLACE FUNCTION public.generate_registration_number()
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
  FROM competition_registrations
  WHERE registered_at::date = CURRENT_DATE;
  RETURN 'REG' || v_date || LPAD(v_count::TEXT, 6, '0');
END;
$$;
