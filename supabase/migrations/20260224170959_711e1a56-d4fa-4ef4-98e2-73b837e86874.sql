
-- Social link pages: stores per-user page customization
CREATE TABLE public.social_link_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_title TEXT,
  page_title_ar TEXT,
  bio TEXT,
  bio_ar TEXT,
  theme TEXT NOT NULL DEFAULT 'default',
  background_color TEXT DEFAULT '#ffffff',
  button_style TEXT DEFAULT 'rounded',
  button_color TEXT DEFAULT '#000000',
  text_color TEXT DEFAULT '#ffffff',
  background_image_url TEXT,
  font_family TEXT DEFAULT 'default',
  show_avatar BOOLEAN DEFAULT true,
  show_social_icons BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  custom_css TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Social link items: individual links on the page
CREATE TABLE public.social_link_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.social_link_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  link_type TEXT NOT NULL DEFAULT 'custom',
  click_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_link_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_link_items ENABLE ROW LEVEL SECURITY;

-- Public read for published pages
CREATE POLICY "Anyone can view published pages"
  ON public.social_link_pages FOR SELECT
  USING (is_published = true);

-- Owner full access on pages
CREATE POLICY "Users manage own page"
  ON public.social_link_pages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read for active items on published pages
CREATE POLICY "Anyone can view active items on published pages"
  ON public.social_link_items FOR SELECT
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM public.social_link_pages WHERE id = page_id AND is_published = true)
  );

-- Owner full access on items
CREATE POLICY "Users manage own items"
  ON public.social_link_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_social_link_pages_updated_at
  BEFORE UPDATE ON public.social_link_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_link_items_updated_at
  BEFORE UPDATE ON public.social_link_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_social_link_items_page_id ON public.social_link_items(page_id);
CREATE INDEX idx_social_link_pages_user_id ON public.social_link_pages(user_id);
