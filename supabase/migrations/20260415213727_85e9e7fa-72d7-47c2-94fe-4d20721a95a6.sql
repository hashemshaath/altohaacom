-- Indexes for frequently queried columns that are currently missing

-- seo_page_views: filtered by path in content gap analyzer
CREATE INDEX IF NOT EXISTS idx_seo_page_views_path ON public.seo_page_views (path);

-- seo_backlinks: ordered by domain_authority
CREATE INDEX IF NOT EXISTS idx_seo_backlinks_domain_authority ON public.seo_backlinks (domain_authority DESC);

-- seo_crawl_log: ordered by created_at
CREATE INDEX IF NOT EXISTS idx_seo_crawl_log_created_at ON public.seo_crawl_log (created_at DESC);

-- seo_tracked_keywords: ordered by current_position and created_at
CREATE INDEX IF NOT EXISTS idx_seo_tracked_keywords_position ON public.seo_tracked_keywords (current_position ASC);

-- product_qa: filtered by catalog_item_id
CREATE INDEX IF NOT EXISTS idx_product_qa_catalog_item ON public.product_qa (catalog_item_id);

-- product_trust_badges: filtered by company_id
CREATE INDEX IF NOT EXISTS idx_product_trust_badges_company ON public.product_trust_badges (company_id);

-- membership_referrals: ordered by created_at
CREATE INDEX IF NOT EXISTS idx_membership_referrals_created ON public.membership_referrals (created_at DESC);

-- seo_indexing_status: ordered by updated_at (already has url unique)
CREATE INDEX IF NOT EXISTS idx_seo_indexing_status_updated ON public.seo_indexing_status (updated_at DESC);

-- auth_hero_slides: ordered by sort_order, filtered by is_active
CREATE INDEX IF NOT EXISTS idx_auth_hero_slides_active_sort ON public.auth_hero_slides (is_active, sort_order);

-- homepage_sections: already has sort index, add is_visible filter
CREATE INDEX IF NOT EXISTS idx_homepage_sections_visible_sort ON public.homepage_sections (is_visible, sort_order) WHERE is_visible = true;