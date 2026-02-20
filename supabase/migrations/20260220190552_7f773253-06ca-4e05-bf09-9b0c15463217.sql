
-- Homepage sections configuration table
CREATE TABLE public.homepage_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL DEFAULT '',
  title_ar TEXT NOT NULL DEFAULT '',
  subtitle_en TEXT DEFAULT '',
  subtitle_ar TEXT DEFAULT '',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  cover_type TEXT DEFAULT 'none' CHECK (cover_type IN ('none', 'background', 'banner')),
  cover_image_url TEXT DEFAULT '',
  cover_height INTEGER DEFAULT 200,
  cover_overlay_opacity INTEGER DEFAULT 50,
  item_count INTEGER DEFAULT 8,
  item_size TEXT DEFAULT 'medium' CHECK (item_size IN ('small', 'medium', 'large')),
  items_per_row INTEGER DEFAULT 4,
  show_filters BOOLEAN DEFAULT true,
  show_view_all BOOLEAN DEFAULT true,
  custom_config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Public read access (needed for homepage rendering)
CREATE POLICY "Anyone can read homepage sections"
  ON public.homepage_sections FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can update homepage sections"
  ON public.homepage_sections FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert homepage sections"
  ON public.homepage_sections FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete homepage sections"
  ON public.homepage_sections FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Seed default sections matching the current homepage order
INSERT INTO public.homepage_sections (section_key, title_en, title_ar, sort_order, item_count, items_per_row, show_filters) VALUES
  ('hero', 'Hero Slider', 'العرض الرئيسي', 1, 5, 1, false),
  ('search', 'Search', 'البحث', 2, 1, 1, false),
  ('stats', 'Platform Stats', 'إحصائيات المنصة', 3, 4, 4, false),
  ('events_by_category', 'Events by Category', 'فعاليات حسب الفئة', 4, 8, 4, true),
  ('ad_banner_top', 'Top Ad Banner', 'إعلان علوي', 5, 1, 1, false),
  ('regional_events', 'Events by Region', 'فعاليات حسب المنطقة', 6, 10, 4, true),
  ('events_calendar', 'Events Calendar', 'تقويم الفعاليات', 7, 6, 3, false),
  ('featured_chefs', 'Featured Chefs', 'الطهاة المميزون', 8, 8, 4, false),
  ('newly_joined', 'Newly Joined', 'المنضمون حديثاً', 9, 8, 4, false),
  ('sponsors', 'Sponsors', 'الرعاة', 10, 10, 5, false),
  ('pro_suppliers', 'Pro Suppliers', 'موردون محترفون', 11, 8, 4, false),
  ('masterclasses', 'Masterclasses', 'الدورات التعليمية', 12, 6, 3, false),
  ('ad_banner_mid', 'Mid Ad Banner', 'إعلان وسطي', 13, 1, 1, false),
  ('sponsorships', 'Sponsorship Opportunities', 'فرص الرعاية', 14, 6, 3, false),
  ('articles', 'Articles', 'المقالات', 15, 6, 3, false),
  ('features', 'Platform Features', 'مميزات المنصة', 16, 6, 3, false),
  ('newsletter', 'Newsletter', 'النشرة البريدية', 17, 1, 1, false),
  ('partners', 'Partners', 'الشركاء', 18, 10, 5, false);

-- Updated_at trigger
CREATE TRIGGER update_homepage_sections_updated_at
  BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
