
-- Sponsorship tier enum
CREATE TYPE public.sponsorship_tier AS ENUM ('platinum', 'gold', 'silver', 'bronze', 'custom');

-- Sponsorship packages (reusable templates)
CREATE TABLE public.sponsorship_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  tier sponsorship_tier NOT NULL,
  description TEXT,
  description_ar TEXT,
  price NUMERIC,
  currency TEXT DEFAULT 'SAR',
  benefits JSONB DEFAULT '[]'::jsonb,
  logo_placement TEXT DEFAULT 'footer',
  logo_on_certificates BOOLEAN DEFAULT false,
  max_sponsors INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.sponsorship_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sponsorship packages"
  ON public.sponsorship_packages FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active packages"
  ON public.sponsorship_packages FOR SELECT
  USING (is_active = true);

-- Competition sponsors (links sponsors to competitions with a tier/package)
CREATE TABLE public.competition_sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.sponsorship_packages(id),
  tier sponsorship_tier NOT NULL DEFAULT 'bronze',
  custom_benefits JSONB DEFAULT '[]'::jsonb,
  logo_url TEXT,
  amount_paid NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(competition_id, company_id)
);

ALTER TABLE public.competition_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage competition sponsors"
  ON public.competition_sponsors FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active sponsors"
  ON public.competition_sponsors FOR SELECT
  USING (status = 'active');

CREATE POLICY "Organizers can manage their competition sponsors"
  ON public.competition_sponsors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM competitions
    WHERE competitions.id = competition_sponsors.competition_id
    AND competitions.organizer_id = auth.uid()
  ));

-- Badge type enum
CREATE TYPE public.badge_type AS ENUM ('gold_winner', 'silver_winner', 'bronze_winner', 'participant', 'judge', 'organizer', 'volunteer', 'sponsor', 'special');

-- Digital badges definitions
CREATE TABLE public.digital_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  badge_type badge_type NOT NULL,
  icon_url TEXT,
  color TEXT DEFAULT '#c9a227',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.digital_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active badges"
  ON public.digital_badges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage badges"
  ON public.digital_badges FOR ALL
  USING (is_admin(auth.uid()));

-- User badges (earned badges)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.digital_badges(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES public.competitions(id),
  certificate_id UUID REFERENCES public.certificates(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  share_token TEXT DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 10)),
  is_public BOOLEAN DEFAULT true,
  UNIQUE(user_id, badge_id, competition_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public badges"
  ON public.user_badges FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user badges"
  ON public.user_badges FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default badge definitions
INSERT INTO public.digital_badges (name, name_ar, badge_type, color, description, description_ar) VALUES
  ('Gold Winner', 'الفائز الذهبي', 'gold_winner', '#FFD700', 'First place in competition', 'المركز الأول في المسابقة'),
  ('Silver Winner', 'الفائز الفضي', 'silver_winner', '#C0C0C0', 'Second place in competition', 'المركز الثاني في المسابقة'),
  ('Bronze Winner', 'الفائز البرونزي', 'bronze_winner', '#CD7F32', 'Third place in competition', 'المركز الثالث في المسابقة'),
  ('Participant', 'مشارك', 'participant', '#4A90D9', 'Competition participant', 'مشارك في المسابقة'),
  ('Judge', 'حكم', 'judge', '#8B5CF6', 'Competition judge', 'حكم في المسابقة'),
  ('Organizer', 'منظم', 'organizer', '#059669', 'Competition organizer', 'منظم المسابقة'),
  ('Sponsor', 'راعي', 'sponsor', '#D97706', 'Competition sponsor', 'راعي المسابقة');

-- Insert default sponsorship packages
INSERT INTO public.sponsorship_packages (name, name_ar, tier, description, description_ar, logo_placement, logo_on_certificates, sort_order, benefits) VALUES
  ('Platinum Sponsor', 'الراعي البلاتيني', 'platinum', 'Premier sponsorship with maximum visibility', 'رعاية رئيسية مع أقصى درجات الظهور', 'header', true, 1, '["Logo on all materials", "VIP access", "Speaking opportunity", "Exclusive booth"]'::jsonb),
  ('Gold Sponsor', 'الراعي الذهبي', 'gold', 'High visibility sponsorship', 'رعاية عالية الظهور', 'header', true, 2, '["Logo on materials", "VIP access", "Booth space"]'::jsonb),
  ('Silver Sponsor', 'الراعي الفضي', 'silver', 'Standard sponsorship package', 'حزمة رعاية قياسية', 'footer', true, 3, '["Logo on materials", "Event access"]'::jsonb),
  ('Bronze Sponsor', 'الراعي البرونزي', 'bronze', 'Basic sponsorship package', 'حزمة رعاية أساسية', 'footer', false, 4, '["Logo mention", "Event access"]'::jsonb);

-- Triggers for updated_at
CREATE TRIGGER update_sponsorship_packages_updated_at
  BEFORE UPDATE ON public.sponsorship_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competition_sponsors_updated_at
  BEFORE UPDATE ON public.competition_sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
