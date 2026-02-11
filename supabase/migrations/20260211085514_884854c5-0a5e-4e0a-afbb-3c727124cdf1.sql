
-- Hero slides for admin-controlled homepage carousel
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  subtitle TEXT,
  subtitle_ar TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  link_label TEXT,
  link_label_ar TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  USING (public.is_admin(auth.uid()));

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT DEFAULT 'homepage'
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view newsletter subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Partner logos for homepage
CREATE TABLE public.partner_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  category TEXT NOT NULL DEFAULT 'partner',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active partner logos"
  ON public.partner_logos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage partner logos"
  ON public.partner_logos FOR ALL
  USING (public.is_admin(auth.uid()));

-- Seed demo hero slides
INSERT INTO public.hero_slides (title, title_ar, subtitle, subtitle_ar, image_url, link_url, link_label, link_label_ar, sort_order) VALUES
('Welcome to Altohaa', 'مرحباً بك في ألتوها', 'The Global Culinary Community Platform', 'منصة مجتمع الطهي العالمي', '/competition-covers/kingdom-chef-2026.jpg', '/auth?tab=signup', 'Join Now', 'انضم الآن', 0),
('Culinary Competitions', 'المسابقات الطهوية', 'Compete with the best chefs worldwide', 'تنافس مع أفضل الطهاة حول العالم', '/competition-covers/international-culinary-championship.jpg', '/competitions', 'Browse Competitions', 'تصفح المسابقات', 1),
('Exhibitions & Events', 'المعارض والفعاليات', 'Discover culinary exhibitions near you', 'اكتشف المعارض الطهوية القريبة منك', '/exhibition-covers/gulf-food-expo-2026.jpg', '/exhibitions', 'View Exhibitions', 'عرض المعارض', 2);
