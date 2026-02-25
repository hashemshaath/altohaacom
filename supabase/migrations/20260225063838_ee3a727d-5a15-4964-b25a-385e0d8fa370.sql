
-- Add page_tab column to social_link_items so links can be assigned to sub-pages
ALTER TABLE public.social_link_items
ADD COLUMN page_tab TEXT NOT NULL DEFAULT 'main';

-- Index for fast filtering
CREATE INDEX idx_social_link_items_page_tab ON public.social_link_items (page_id, page_tab);
