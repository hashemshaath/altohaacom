
-- Auth hero slides table for login/register page slider
CREATE TABLE public.auth_hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  title_ar TEXT,
  subtitle TEXT,
  subtitle_ar TEXT,
  image_url TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'individual' CHECK (page_type IN ('individual', 'company', 'both')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.auth_hero_slides ENABLE ROW LEVEL SECURITY;

-- Public read for active slides (auth pages are public)
CREATE POLICY "Anyone can view active auth hero slides"
ON public.auth_hero_slides FOR SELECT
USING (is_active = true);

-- Admin management
CREATE POLICY "Admins can manage auth hero slides"
ON public.auth_hero_slides FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

-- Insert default slides
INSERT INTO public.auth_hero_slides (title, title_ar, subtitle, subtitle_ar, image_url, page_type, sort_order) VALUES
('Welcome to Altoha', 'مرحباً بك في التحة', 'The Global Culinary Community', 'مجتمع الطهي العالمي', '/auth-hero-1.jpg', 'both', 0),
('Compete Globally', 'تنافس عالمياً', 'Join thousands of culinary professionals', 'انضم لآلاف المحترفين في الطهي', '/auth-hero-2.jpg', 'both', 1),
('Grow Your Business', 'نمِّ أعمالك', 'Connect with top chefs and food brands', 'تواصل مع كبار الطهاة والعلامات التجارية', '/auth-hero-3.jpg', 'company', 2);
