
-- Supplier reviews table
CREATE TABLE public.supplier_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE public.supplier_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews"
ON public.supplier_reviews FOR SELECT
USING (status = 'published');

CREATE POLICY "Authenticated users can create reviews"
ON public.supplier_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON public.supplier_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.supplier_reviews FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_supplier_reviews_updated_at
BEFORE UPDATE ON public.supplier_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_supplier_reviews_company ON public.supplier_reviews(company_id);
CREATE INDEX idx_supplier_reviews_user ON public.supplier_reviews(user_id);
