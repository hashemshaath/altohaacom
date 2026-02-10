
-- Create a DB function to auto-create a company transaction when an invoice is marked paid
CREATE OR REPLACE FUNCTION public.auto_create_transaction_on_invoice_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') AND NEW.company_id IS NOT NULL THEN
    INSERT INTO public.company_transactions (
      company_id,
      type,
      amount,
      currency,
      description,
      description_ar,
      invoice_id,
      transaction_date,
      created_by
    ) VALUES (
      NEW.company_id,
      'payment',
      COALESCE(NEW.amount, 0),
      COALESCE(NEW.currency, 'SAR'),
      'Payment for invoice ' || NEW.invoice_number,
      'دفع الفاتورة ' || NEW.invoice_number,
      NEW.id,
      NOW(),
      NEW.issued_by
    );
  END IF;

  -- Auto-create debit transaction when invoice is sent
  IF NEW.status = 'sent' AND (OLD.status IS DISTINCT FROM 'sent') AND NEW.company_id IS NOT NULL THEN
    INSERT INTO public.company_transactions (
      company_id,
      type,
      amount,
      currency,
      description,
      description_ar,
      invoice_id,
      transaction_date,
      created_by
    ) VALUES (
      NEW.company_id,
      'invoice',
      COALESCE(NEW.amount, 0),
      COALESCE(NEW.currency, 'SAR'),
      'Invoice ' || NEW.invoice_number,
      'فاتورة ' || NEW.invoice_number,
      NEW.id,
      NOW(),
      NEW.issued_by
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to invoices table
CREATE TRIGGER trigger_auto_transaction_on_invoice_update
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_transaction_on_invoice_paid();
