
-- Ad Placements: defines available ad slots on the platform
CREATE TABLE public.ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ar TEXT,
  placement_type TEXT NOT NULL DEFAULT 'banner', -- banner, popup, sidebar, in_content, section_sponsor, article_sponsor
  format TEXT NOT NULL DEFAULT 'horizontal', -- horizontal, vertical, square, popup, native
  width INTEGER,
  height INTEGER,
  page_location TEXT, -- home, competitions, exhibitions, tastings, articles, community, global
  position TEXT, -- top, bottom, sidebar_left, sidebar_right, in_feed, overlay
  max_ads INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  base_cpm DECIMAL(10,2) DEFAULT 5.00, -- base cost per 1000 impressions
  base_cpc DECIMAL(10,2) DEFAULT 0.50, -- base cost per click
  base_cpv DECIMAL(10,2) DEFAULT 0.10, -- base cost per view
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Packages: predefined bundles for companies
CREATE TABLE public.ad_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  tier TEXT NOT NULL DEFAULT 'bronze', -- bronze, silver, gold, platinum, custom
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  duration_days INTEGER DEFAULT 30,
  max_impressions INTEGER,
  max_clicks INTEGER,
  max_campaigns INTEGER DEFAULT 1,
  included_placements TEXT[] DEFAULT '{}', -- placement slugs
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Campaigns: company advertising campaigns
CREATE TABLE public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.ad_packages(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  billing_model TEXT NOT NULL DEFAULT 'package', -- package, cpm, cpc, cpv, flat_rate
  budget DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_countries TEXT[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT '{}', -- chef, judge, organizer, company
  target_interests TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_approval, approved, active, paused, completed, rejected
  rejection_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  priority INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Creatives: actual ad content (images, text)
CREATE TABLE public.ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  placement_id UUID REFERENCES public.ad_placements(id) NOT NULL,
  title TEXT,
  title_ar TEXT,
  body_text TEXT,
  body_text_ar TEXT,
  image_url TEXT,
  video_url TEXT,
  cta_text TEXT DEFAULT 'Learn More',
  cta_text_ar TEXT DEFAULT 'اعرف المزيد',
  destination_url TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'image', -- image, video, html, native
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, archived
  rejection_reason TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Impressions: tracking table
CREATE TABLE public.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  placement_id UUID REFERENCES public.ad_placements(id) NOT NULL,
  user_id UUID,
  session_id TEXT,
  page_url TEXT,
  country TEXT,
  device_type TEXT, -- desktop, mobile, tablet
  browser TEXT,
  cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Clicks: tracking table
CREATE TABLE public.ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  placement_id UUID REFERENCES public.ad_placements(id) NOT NULL,
  user_id UUID,
  session_id TEXT,
  page_url TEXT,
  destination_url TEXT,
  country TEXT,
  device_type TEXT,
  browser TEXT,
  cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Section Sponsorships: sponsoring specific sections/articles
CREATE TABLE public.ad_section_sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  section_type TEXT NOT NULL, -- competition, exhibition, tasting, article, masterclass, recipe
  section_id UUID,
  logo_url TEXT,
  label TEXT DEFAULT 'Sponsored by',
  label_ar TEXT DEFAULT 'برعاية',
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Requests: company requests to advertise (approval workflow)
CREATE TABLE public.ad_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.ad_packages(id),
  request_type TEXT NOT NULL DEFAULT 'campaign', -- campaign, sponsorship, popup, custom
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  desired_placements TEXT[] DEFAULT '{}',
  desired_start_date TIMESTAMPTZ,
  desired_end_date TIMESTAMPTZ,
  budget DECIMAL(10,2),
  currency TEXT DEFAULT 'SAR',
  materials_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, under_review, approved, rejected, cancelled
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_section_sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_requests ENABLE ROW LEVEL SECURITY;

-- Public read for placements, packages (catalog)
CREATE POLICY "Anyone can view active placements" ON public.ad_placements FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage placements" ON public.ad_placements FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active packages" ON public.ad_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage packages" ON public.ad_packages FOR ALL USING (public.is_admin(auth.uid()));

-- Company campaigns: company members + admins
CREATE POLICY "Company members view own campaigns" ON public.ad_campaigns 
  FOR SELECT USING (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Company members create campaigns" ON public.ad_campaigns 
  FOR INSERT WITH CHECK (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
  );
CREATE POLICY "Company members update own campaigns" ON public.ad_campaigns 
  FOR UPDATE USING (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Admins delete campaigns" ON public.ad_campaigns FOR DELETE USING (public.is_admin(auth.uid()));

-- Creatives: company + admin
CREATE POLICY "Company view own creatives" ON public.ad_creatives 
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.ad_campaigns WHERE company_id IN (SELECT public.get_user_company_id(auth.uid())))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Company create creatives" ON public.ad_creatives 
  FOR INSERT WITH CHECK (
    campaign_id IN (SELECT id FROM public.ad_campaigns WHERE company_id IN (SELECT public.get_user_company_id(auth.uid())))
  );
CREATE POLICY "Company or admin update creatives" ON public.ad_creatives 
  FOR UPDATE USING (
    campaign_id IN (SELECT id FROM public.ad_campaigns WHERE company_id IN (SELECT public.get_user_company_id(auth.uid())))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Admins delete creatives" ON public.ad_creatives FOR DELETE USING (public.is_admin(auth.uid()));

-- Active creatives readable by all (for displaying ads)
CREATE POLICY "Anyone can view active creatives for display" ON public.ad_creatives 
  FOR SELECT USING (is_active = true AND status = 'approved');

-- Impressions & Clicks: insert by anyone (tracking), read by company/admin
CREATE POLICY "Anyone can insert impressions" ON public.ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "Company or admin view impressions" ON public.ad_impressions 
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.ad_campaigns WHERE company_id IN (SELECT public.get_user_company_id(auth.uid())))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Anyone can insert clicks" ON public.ad_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Company or admin view clicks" ON public.ad_clicks 
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.ad_campaigns WHERE company_id IN (SELECT public.get_user_company_id(auth.uid())))
    OR public.is_admin(auth.uid())
  );

-- Section sponsorships: public read for active, company/admin manage
CREATE POLICY "Anyone view active sponsorships" ON public.ad_section_sponsorships 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Company or admin manage sponsorships" ON public.ad_section_sponsorships 
  FOR ALL USING (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
    OR public.is_admin(auth.uid())
  );

-- Ad Requests: company create/view, admin manage
CREATE POLICY "Company view own requests" ON public.ad_requests 
  FOR SELECT USING (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Company create requests" ON public.ad_requests 
  FOR INSERT WITH CHECK (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
  );
CREATE POLICY "Company or admin update requests" ON public.ad_requests 
  FOR UPDATE USING (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
    OR public.is_admin(auth.uid())
  );

-- Enable realtime for tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_campaigns;

-- Create storage bucket for ad creatives
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-creatives', 'ad-creatives', true);
CREATE POLICY "Anyone can view ad creatives" ON storage.objects FOR SELECT USING (bucket_id = 'ad-creatives');
CREATE POLICY "Authenticated users upload ad creatives" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ad-creatives' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own ad creatives" ON storage.objects FOR UPDATE USING (bucket_id = 'ad-creatives' AND auth.role() = 'authenticated');

-- Seed default placements
INSERT INTO public.ad_placements (name, name_ar, slug, placement_type, format, width, height, page_location, position, base_cpm, base_cpc, sort_order) VALUES
('Homepage Hero Banner', 'بانر الصفحة الرئيسية', 'home-hero-banner', 'banner', 'horizontal', 1200, 300, 'home', 'top', 15.00, 1.50, 1),
('Homepage Sidebar', 'الشريط الجانبي للرئيسية', 'home-sidebar', 'banner', 'vertical', 300, 600, 'home', 'sidebar_right', 8.00, 0.80, 2),
('Competition Page Banner', 'بانر صفحة المسابقات', 'competition-banner', 'banner', 'horizontal', 1200, 250, 'competitions', 'top', 12.00, 1.20, 3),
('In-Feed Ad', 'إعلان في الخلاصة', 'in-feed', 'in_content', 'native', 600, 400, 'global', 'in_feed', 6.00, 0.60, 4),
('Pop-up Overlay', 'إعلان منبثق', 'popup-overlay', 'popup', 'square', 600, 500, 'global', 'overlay', 20.00, 2.00, 5),
('Article Sidebar', 'الشريط الجانبي للمقالات', 'article-sidebar', 'banner', 'vertical', 300, 600, 'articles', 'sidebar_right', 7.00, 0.70, 6),
('Exhibition Banner', 'بانر المعارض', 'exhibition-banner', 'banner', 'horizontal', 1200, 250, 'exhibitions', 'top', 10.00, 1.00, 7),
('Section Sponsorship', 'رعاية القسم', 'section-sponsor', 'section_sponsor', 'native', null, null, 'global', 'in_feed', 25.00, 3.00, 8);

-- Seed default packages
INSERT INTO public.ad_packages (name, name_ar, description, description_ar, tier, price, duration_days, max_impressions, max_clicks, max_campaigns, included_placements, sort_order) VALUES
('Bronze', 'برونزي', 'Basic ad package with sidebar placements', 'باقة إعلانية أساسية', 'bronze', 500, 30, 10000, 500, 1, ARRAY['home-sidebar', 'article-sidebar'], 1),
('Silver', 'فضي', 'Enhanced visibility with banner + sidebar', 'رؤية محسّنة مع بانر وشريط جانبي', 'silver', 1500, 30, 50000, 2500, 3, ARRAY['home-sidebar', 'article-sidebar', 'competition-banner', 'in-feed'], 2),
('Gold', 'ذهبي', 'Premium placement including hero + popups', 'موضع مميز بما في ذلك البانر الرئيسي', 'gold', 5000, 30, 200000, 10000, 5, ARRAY['home-hero-banner', 'home-sidebar', 'competition-banner', 'exhibition-banner', 'in-feed', 'popup-overlay'], 3),
('Platinum', 'بلاتيني', 'Full platform coverage + section sponsorship', 'تغطية كاملة للمنصة مع رعاية الأقسام', 'platinum', 15000, 30, null, null, 10, ARRAY['home-hero-banner', 'home-sidebar', 'competition-banner', 'exhibition-banner', 'article-sidebar', 'in-feed', 'popup-overlay', 'section-sponsor'], 4);
