
-- Trigger for competition_registrations
CREATE OR REPLACE FUNCTION public.trigger_set_registration_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.registration_number IS NULL OR NEW.registration_number = '' THEN
    NEW.registration_number := generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_registration_number
BEFORE INSERT ON public.competition_registrations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_registration_number();

-- Trigger for company_orders
CREATE OR REPLACE FUNCTION public.trigger_set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON public.company_orders
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_order_number();

-- Trigger for company_transactions
CREATE OR REPLACE FUNCTION public.trigger_set_transaction_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
    NEW.transaction_number := generate_transaction_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_transaction_number
BEFORE INSERT ON public.company_transactions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_transaction_number();

-- Trigger for invoices
CREATE OR REPLACE FUNCTION public.trigger_set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_invoice_number();

-- Trigger for certificates
CREATE OR REPLACE FUNCTION public.trigger_set_certificate_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.certificate_number IS NULL OR NEW.certificate_number = '' THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_certificate_number
BEFORE INSERT ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_certificate_number();

-- Make order_number, transaction_number, invoice_number nullable with defaults so inserts without them work
ALTER TABLE public.company_orders ALTER COLUMN order_number SET DEFAULT '';
ALTER TABLE public.company_transactions ALTER COLUMN transaction_number SET DEFAULT '';
ALTER TABLE public.invoices ALTER COLUMN invoice_number SET DEFAULT '';
ALTER TABLE public.certificates ALTER COLUMN certificate_number SET DEFAULT '';
