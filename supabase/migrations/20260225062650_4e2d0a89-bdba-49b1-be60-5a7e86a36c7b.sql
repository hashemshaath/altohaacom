
-- Create table for tracking individual link clicks
CREATE TABLE public.social_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.social_link_pages(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES public.social_link_items(id) ON DELETE CASCADE,
  country TEXT,
  device_type TEXT,
  browser TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_social_link_clicks_page_id ON public.social_link_clicks(page_id);
CREATE INDEX idx_social_link_clicks_link_id ON public.social_link_clicks(link_id);
CREATE INDEX idx_social_link_clicks_created_at ON public.social_link_clicks(created_at);

-- Enable RLS
ALTER TABLE public.social_link_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (fire-and-forget from public page)
CREATE POLICY "Anyone can insert link clicks"
  ON public.social_link_clicks
  FOR INSERT
  WITH CHECK (true);

-- Page owners can read their click data
CREATE POLICY "Page owners can read their clicks"
  ON public.social_link_clicks
  FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM public.social_link_pages WHERE user_id = auth.uid()
    )
  );
