-- Performance indexes for homepage-critical queries

-- Hero slides: active slides sorted by order
CREATE INDEX IF NOT EXISTS idx_hero_slides_active_sort 
ON public.hero_slides (sort_order) 
WHERE is_active = true;

-- Homepage sections: sorted by order
CREATE INDEX IF NOT EXISTS idx_homepage_sections_sort 
ON public.homepage_sections (sort_order);

-- Testimonials: active sorted by order
CREATE INDEX IF NOT EXISTS idx_testimonials_active_sort 
ON public.testimonials (sort_order) 
WHERE is_active = true;

-- Partner logos: active by category and sort
CREATE INDEX IF NOT EXISTS idx_partner_logos_active_cat_sort 
ON public.partner_logos (category, sort_order) 
WHERE is_active = true;

-- Articles: published articles sorted by date (used in homepage prefetch)
CREATE INDEX IF NOT EXISTS idx_articles_published_date 
ON public.articles (published_at DESC) 
WHERE status = 'published';

-- Articles: published articles sorted by view_count (trending)
CREATE INDEX IF NOT EXISTS idx_articles_published_views 
ON public.articles (view_count DESC) 
WHERE status = 'published';

-- Masterclasses: published/upcoming sorted by start_date
CREATE INDEX IF NOT EXISTS idx_masterclasses_status_date 
ON public.masterclasses (start_date ASC NULLS LAST) 
WHERE status IN ('published', 'upcoming');

-- Chef rankings: all_time sorted by points
CREATE INDEX IF NOT EXISTS idx_chef_rankings_alltime_points 
ON public.chef_rankings (total_points DESC) 
WHERE ranking_period = 'all_time';