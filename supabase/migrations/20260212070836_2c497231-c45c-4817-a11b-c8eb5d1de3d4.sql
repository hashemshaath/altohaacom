
-- ═══════════════════════════════════════════════════════
-- 1. Add display_name and city columns to profiles
-- ═══════════════════════════════════════════════════════
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- ═══════════════════════════════════════════════════════
-- 2. Specialties table with admin approval workflow
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'culinary',
  description TEXT,
  description_ar TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved specialties" ON public.specialties
  FOR SELECT USING (is_approved = true AND is_active = true);

CREATE POLICY "Admins can manage all specialties" ON public.specialties
  FOR ALL USING (public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Authenticated users can suggest specialties" ON public.specialties
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- User-specialty junction table
CREATE TABLE IF NOT EXISTS public.user_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, specialty_id)
);

ALTER TABLE public.user_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user specialties" ON public.user_specialties
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own specialties" ON public.user_specialties
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user specialties" ON public.user_specialties
  FOR ALL USING (public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'supervisor'));

-- ═══════════════════════════════════════════════════════
-- 3. User follows table (Instagram-like follow system)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.user_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_specialties_approved ON public.specialties(is_approved, is_active);
CREATE INDEX IF NOT EXISTS idx_user_specialties_user ON public.user_specialties(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_specialties_updated_at
  BEFORE UPDATE ON public.specialties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed common culinary specialties
INSERT INTO public.specialties (name, name_ar, slug, category, is_approved, is_active) VALUES
  ('Pastry & Baking', 'الحلويات والمخبوزات', 'pastry-baking', 'culinary', true, true),
  ('Sushi & Japanese Cuisine', 'السوشي والمطبخ الياباني', 'sushi-japanese', 'culinary', true, true),
  ('Italian Cuisine', 'المطبخ الإيطالي', 'italian-cuisine', 'culinary', true, true),
  ('French Cuisine', 'المطبخ الفرنسي', 'french-cuisine', 'culinary', true, true),
  ('Arabic Cuisine', 'المطبخ العربي', 'arabic-cuisine', 'culinary', true, true),
  ('Grilling & BBQ', 'الشواء والمشويات', 'grilling-bbq', 'culinary', true, true),
  ('Seafood', 'المأكولات البحرية', 'seafood', 'culinary', true, true),
  ('Vegan & Plant-Based', 'نباتي وبدائل نباتية', 'vegan-plant-based', 'culinary', true, true),
  ('Chocolate & Confectionery', 'الشوكولاتة والحلويات', 'chocolate-confectionery', 'culinary', true, true),
  ('Food Styling & Photography', 'تنسيق وتصوير الطعام', 'food-styling', 'culinary', true, true),
  ('Molecular Gastronomy', 'فن الطهي الجزيئي', 'molecular-gastronomy', 'culinary', true, true),
  ('Butchery & Charcuterie', 'الجزارة واللحوم المعالجة', 'butchery-charcuterie', 'culinary', true, true),
  ('Beverage & Mixology', 'المشروبات وفن الخلط', 'beverage-mixology', 'culinary', true, true),
  ('Catering & Events', 'تقديم الطعام والفعاليات', 'catering-events', 'culinary', true, true),
  ('Nutrition & Diet', 'التغذية والحميات', 'nutrition-diet', 'culinary', true, true)
ON CONFLICT (slug) DO NOTHING;
