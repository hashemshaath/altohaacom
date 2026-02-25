
-- Email subscribers table for bio page email collection
CREATE TABLE public.bio_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.social_link_pages(id) ON DELETE CASCADE,
  page_owner_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(page_id, email)
);

-- Enable RLS
ALTER TABLE public.bio_subscribers ENABLE ROW LEVEL SECURITY;

-- Page owners can view their subscribers
CREATE POLICY "Owners can view their subscribers"
ON public.bio_subscribers FOR SELECT
USING (page_owner_id = auth.uid() OR public.is_admin_user());

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe"
ON public.bio_subscribers FOR INSERT
WITH CHECK (true);

-- Owners can delete subscribers
CREATE POLICY "Owners can delete subscribers"
ON public.bio_subscribers FOR DELETE
USING (page_owner_id = auth.uid() OR public.is_admin_user());

-- Index for fast lookups
CREATE INDEX idx_bio_subscribers_page ON public.bio_subscribers(page_id);
CREATE INDEX idx_bio_subscribers_owner ON public.bio_subscribers(page_owner_id);
