
-- Drop old system and create new Shopify-like homepage blocks
CREATE TABLE public.homepage_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identity
  title_en TEXT NOT NULL DEFAULT '',
  title_ar TEXT NOT NULL DEFAULT '',
  subtitle_en TEXT NOT NULL DEFAULT '',
  subtitle_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  
  -- Ordering & Visibility
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  
  -- Data Source
  data_source TEXT NOT NULL DEFAULT 'chefs',  -- chefs, companies, establishments, competitions, events, articles, recipes, products, custom
  data_filter JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { "sort_by": "latest|most_viewed|top_rated|newly_registered", "country": null, "category": null, "status": "active", "is_featured": false, "tags": [], "ids": [] }
  data_limit INTEGER NOT NULL DEFAULT 8,
  
  -- Display Layout
  display_style TEXT NOT NULL DEFAULT 'grid',  -- grid, carousel, featured_list, cover_banner, list, masonry
  
  -- Grid Settings
  items_per_row INTEGER NOT NULL DEFAULT 4,
  items_per_row_tablet INTEGER NOT NULL DEFAULT 2,
  items_per_row_mobile INTEGER NOT NULL DEFAULT 1,
  row_count INTEGER NOT NULL DEFAULT 2,
  grid_gap TEXT NOT NULL DEFAULT 'md',  -- xs, sm, md, lg, xl
  
  -- Carousel Settings
  carousel_autoplay BOOLEAN NOT NULL DEFAULT false,
  carousel_speed INTEGER NOT NULL DEFAULT 3000,  -- ms
  carousel_direction TEXT NOT NULL DEFAULT 'ltr',  -- ltr, rtl
  carousel_loop BOOLEAN NOT NULL DEFAULT true,
  carousel_arrows BOOLEAN NOT NULL DEFAULT true,
  carousel_dots BOOLEAN NOT NULL DEFAULT true,
  carousel_peek BOOLEAN NOT NULL DEFAULT false,  -- show partial next/prev items
  
  -- Cover/Banner Settings
  cover_image_url TEXT NOT NULL DEFAULT '',
  cover_position TEXT NOT NULL DEFAULT 'top',  -- top, left, right, background, none
  cover_height INTEGER NOT NULL DEFAULT 300,
  cover_overlay_opacity REAL NOT NULL DEFAULT 0.4,
  cover_text_align TEXT NOT NULL DEFAULT 'center',  -- left, center, right
  
  -- Card Template
  card_template TEXT NOT NULL DEFAULT 'standard',  -- standard, minimal, overlay, horizontal, detailed, compact
  card_image_ratio TEXT NOT NULL DEFAULT '4:3',  -- 1:1, 4:3, 16:9, 3:4, 2:3, auto
  card_image_position TEXT NOT NULL DEFAULT 'top',  -- top, left, right, background
  card_show_avatar BOOLEAN NOT NULL DEFAULT true,
  card_show_badge BOOLEAN NOT NULL DEFAULT true,
  card_show_rating BOOLEAN NOT NULL DEFAULT false,
  card_show_description BOOLEAN NOT NULL DEFAULT true,
  card_show_cta BOOLEAN NOT NULL DEFAULT false,
  card_cta_text_en TEXT NOT NULL DEFAULT 'View',
  card_cta_text_ar TEXT NOT NULL DEFAULT 'عرض',
  
  -- Item Sizing
  item_height TEXT NOT NULL DEFAULT 'auto',  -- auto, sm(200px), md(280px), lg(360px), xl(440px), custom
  item_height_custom INTEGER,
  
  -- Section Styling
  bg_color TEXT NOT NULL DEFAULT '',
  bg_gradient TEXT NOT NULL DEFAULT '',  -- e.g., "linear-gradient(135deg, #1a1a2e, #16213e)"
  text_color TEXT NOT NULL DEFAULT '',
  section_padding TEXT NOT NULL DEFAULT 'md',  -- none, sm, md, lg, xl
  container_width TEXT NOT NULL DEFAULT 'default',  -- narrow, default, wide, full
  border_style TEXT NOT NULL DEFAULT 'none',  -- none, top, bottom, both, card
  
  -- Animation
  animation TEXT NOT NULL DEFAULT 'none',  -- none, fade, slide-up, slide-left, scale, blur, stagger
  animation_delay INTEGER NOT NULL DEFAULT 0,
  
  -- Header/Footer
  show_section_header BOOLEAN NOT NULL DEFAULT true,
  show_view_all BOOLEAN NOT NULL DEFAULT true,
  view_all_link TEXT NOT NULL DEFAULT '',
  show_filters BOOLEAN NOT NULL DEFAULT false,
  filter_options JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ["category", "country", "status"]
  
  -- Advanced
  custom_css TEXT NOT NULL DEFAULT '',
  custom_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_blocks ENABLE ROW LEVEL SECURITY;

-- Public read for everyone (homepage is public)
CREATE POLICY "Anyone can view homepage blocks"
  ON public.homepage_blocks FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert homepage blocks"
  ON public.homepage_blocks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update homepage blocks"
  ON public.homepage_blocks FOR UPDATE
  TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "Admins can delete homepage blocks"
  ON public.homepage_blocks FOR DELETE
  TO authenticated
  USING (public.is_admin_user());

-- Index for ordering
CREATE INDEX idx_homepage_blocks_sort ON public.homepage_blocks (sort_order ASC);

-- Updated_at trigger
CREATE TRIGGER update_homepage_blocks_updated_at
  BEFORE UPDATE ON public.homepage_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
