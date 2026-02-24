-- Add scheduling columns to social_link_items
ALTER TABLE public.social_link_items ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.social_link_items ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.social_link_items ADD COLUMN IF NOT EXISTS custom_css TEXT DEFAULT NULL;

-- Create visit tracking table for advanced analytics
CREATE TABLE public.social_link_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES public.social_link_pages(id) ON DELETE CASCADE,
  user_id UUID DEFAULT NULL,
  country TEXT DEFAULT NULL,
  device_type TEXT DEFAULT NULL,
  browser TEXT DEFAULT NULL,
  referrer TEXT DEFAULT NULL,
  page_url TEXT DEFAULT NULL,
  session_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_link_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert visits (public bio pages)
CREATE POLICY "Anyone can insert visits" ON public.social_link_visits FOR INSERT WITH CHECK (true);

-- Page owners can read their own visits
CREATE POLICY "Page owners can read their visits" ON public.social_link_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_link_pages p WHERE p.id = page_id AND p.user_id = auth.uid()
    )
  );

-- Admins can read all
CREATE POLICY "Admins can read all visits" ON public.social_link_visits FOR SELECT
  USING (public.is_admin_user());

-- Index for analytics queries
CREATE INDEX idx_social_link_visits_page_id ON public.social_link_visits(page_id);
CREATE INDEX idx_social_link_visits_created_at ON public.social_link_visits(created_at DESC);