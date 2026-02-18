
-- Supplier wishlists (users save favorite suppliers)
CREATE TABLE public.supplier_wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.supplier_wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlists" ON public.supplier_wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist" ON public.supplier_wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist" ON public.supplier_wishlists
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_supplier_wishlists_user ON public.supplier_wishlists(user_id);
CREATE INDEX idx_supplier_wishlists_company ON public.supplier_wishlists(company_id);

-- Supplier profile views tracking
CREATE TABLE public.supplier_profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  viewer_id UUID,
  session_id TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  referrer TEXT
);

ALTER TABLE public.supplier_profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (including anonymous)
CREATE POLICY "Anyone can record a view" ON public.supplier_profile_views
  FOR INSERT WITH CHECK (true);

-- Company contacts can read their own views
CREATE POLICY "Company contacts can view stats" ON public.supplier_profile_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_contacts cc
      WHERE cc.company_id = supplier_profile_views.company_id
      AND cc.user_id = auth.uid()
    )
    OR public.is_admin_user()
  );

CREATE INDEX idx_supplier_views_company ON public.supplier_profile_views(company_id);
CREATE INDEX idx_supplier_views_date ON public.supplier_profile_views(viewed_at);
