
-- Enhance invoices table with company, order, and line item support
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.company_orders(id),
  ADD COLUMN IF NOT EXISTS competition_id UUID REFERENCES public.competitions(id),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS notes_ar TEXT,
  ADD COLUMN IF NOT EXISTS issued_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;

-- Recreate policies
CREATE POLICY "Admins can manage all invoices"
ON public.invoices FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Company contacts can view company invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (company_id IN (SELECT public.get_user_company_id(auth.uid())));
