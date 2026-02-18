
-- =====================================================
-- CHEF'S TABLE - B2B Product Evaluation Service
-- =====================================================

-- 1. Company requests product evaluation
CREATE TABLE public.chefs_table_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  request_number TEXT,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  product_name TEXT NOT NULL,
  product_name_ar TEXT,
  product_category TEXT NOT NULL DEFAULT 'other',
  product_description TEXT,
  product_description_ar TEXT,
  product_images TEXT[] DEFAULT '{}',
  experience_type TEXT NOT NULL DEFAULT 'venue',
  preferred_venue TEXT,
  preferred_venue_ar TEXT,
  preferred_city TEXT,
  preferred_country_code TEXT,
  preferred_date_start DATE,
  preferred_date_end DATE,
  budget NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  chef_count INTEGER DEFAULT 3,
  special_requirements TEXT,
  special_requirements_ar TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Approved session
CREATE TABLE public.chefs_table_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.chefs_table_requests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_number TEXT,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  product_name TEXT NOT NULL,
  product_name_ar TEXT,
  product_category TEXT NOT NULL DEFAULT 'other',
  experience_type TEXT NOT NULL DEFAULT 'venue',
  venue TEXT,
  venue_ar TEXT,
  city TEXT,
  country_code TEXT,
  session_date TIMESTAMPTZ,
  session_end TIMESTAMPTZ,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  organizer_id UUID NOT NULL,
  chef_selection_method TEXT DEFAULT 'admin',
  max_chefs INTEGER DEFAULT 5,
  sample_delivery_address TEXT,
  sample_delivery_notes TEXT,
  notes TEXT,
  notes_ar TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Chef invitations
CREATE TABLE public.chefs_table_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chefs_table_sessions(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  invitation_message TEXT,
  invitation_message_ar TEXT,
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  declined_reason TEXT,
  sample_shipped_at TIMESTAMPTZ,
  sample_tracking_number TEXT,
  cooking_date TIMESTAMPTZ,
  cooking_location TEXT,
  cooking_location_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, chef_id)
);

-- 4. Chef evaluations (the core product review)
CREATE TABLE public.chefs_table_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chefs_table_sessions(id) ON DELETE CASCADE,
  invitation_id UUID NOT NULL REFERENCES public.chefs_table_invitations(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL,
  taste_score INTEGER,
  texture_score INTEGER,
  aroma_score INTEGER,
  versatility_score INTEGER,
  value_score INTEGER,
  presentation_score INTEGER,
  overall_score NUMERIC(4,2),
  is_recommended BOOLEAN,
  recommendation_level TEXT DEFAULT 'neutral',
  review_title TEXT,
  review_title_ar TEXT,
  review_text TEXT,
  review_text_ar TEXT,
  cooking_experience TEXT,
  cooking_experience_ar TEXT,
  dishes_prepared TEXT,
  dishes_prepared_ar TEXT,
  pros TEXT,
  pros_ar TEXT,
  cons TEXT,
  cons_ar TEXT,
  usage_suggestions TEXT,
  usage_suggestions_ar TEXT,
  endorsement_text TEXT,
  endorsement_text_ar TEXT,
  allow_publish BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, chef_id)
);

-- 5. Media documentation
CREATE TABLE public.chefs_table_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chefs_table_sessions(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES public.chefs_table_evaluations(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Evaluation criteria templates for Chef's Table
CREATE TABLE public.chefs_table_criteria_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preset_name TEXT NOT NULL,
  preset_name_ar TEXT,
  product_category TEXT NOT NULL DEFAULT 'general',
  criteria JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.chefs_table_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chefs_table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chefs_table_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chefs_table_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chefs_table_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chefs_table_criteria_presets ENABLE ROW LEVEL SECURITY;

-- Requests: company members can manage, admins can view all
CREATE POLICY "Company members manage own requests" ON public.chefs_table_requests
  FOR ALL USING (
    requested_by = auth.uid() 
    OR company_id IN (SELECT public.get_user_company_id(auth.uid()))
    OR public.is_admin(auth.uid())
  );

-- Sessions: public read for published, full access for organizers/admins
CREATE POLICY "Public read published sessions" ON public.chefs_table_sessions
  FOR SELECT USING (is_published = true OR organizer_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage sessions" ON public.chefs_table_sessions
  FOR ALL USING (organizer_id = auth.uid() OR public.is_admin(auth.uid()));

-- Invitations: invited chefs + admins
CREATE POLICY "Chefs see own invitations" ON public.chefs_table_invitations
  FOR SELECT USING (chef_id = auth.uid() OR invited_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage invitations" ON public.chefs_table_invitations
  FOR ALL USING (invited_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Chefs respond to invitations" ON public.chefs_table_invitations
  FOR UPDATE USING (chef_id = auth.uid())
  WITH CHECK (chef_id = auth.uid());

-- Evaluations: chefs manage own, public read if published
CREATE POLICY "Chefs manage own evaluations" ON public.chefs_table_evaluations
  FOR ALL USING (chef_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Public read submitted evaluations" ON public.chefs_table_evaluations
  FOR SELECT USING (status = 'submitted' AND allow_publish = true);

-- Media: public read, uploaders manage
CREATE POLICY "Public read media" ON public.chefs_table_media
  FOR SELECT USING (true);

CREATE POLICY "Uploaders manage media" ON public.chefs_table_media
  FOR ALL USING (uploaded_by = auth.uid() OR public.is_admin(auth.uid()));

-- Criteria presets: public read
CREATE POLICY "Public read criteria presets" ON public.chefs_table_criteria_presets
  FOR SELECT USING (true);

CREATE POLICY "Admins manage criteria presets" ON public.chefs_table_criteria_presets
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_ct_requests_company ON public.chefs_table_requests(company_id);
CREATE INDEX idx_ct_requests_status ON public.chefs_table_requests(status);
CREATE INDEX idx_ct_sessions_request ON public.chefs_table_sessions(request_id);
CREATE INDEX idx_ct_sessions_status ON public.chefs_table_sessions(status);
CREATE INDEX idx_ct_invitations_session ON public.chefs_table_invitations(session_id);
CREATE INDEX idx_ct_invitations_chef ON public.chefs_table_invitations(chef_id);
CREATE INDEX idx_ct_evaluations_session ON public.chefs_table_evaluations(session_id);
CREATE INDEX idx_ct_media_session ON public.chefs_table_media(session_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_ct_requests_updated_at
  BEFORE UPDATE ON public.chefs_table_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ct_sessions_updated_at
  BEFORE UPDATE ON public.chefs_table_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ct_invitations_updated_at
  BEFORE UPDATE ON public.chefs_table_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ct_evaluations_updated_at
  BEFORE UPDATE ON public.chefs_table_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED: Default criteria presets
-- =====================================================

INSERT INTO public.chefs_table_criteria_presets (preset_name, preset_name_ar, product_category, criteria) VALUES
('Meat Products', 'منتجات اللحوم', 'meat', '[
  {"name": "Taste & Flavor", "name_ar": "المذاق والنكهة", "max_score": 10, "weight": 25},
  {"name": "Texture & Tenderness", "name_ar": "القوام والطراوة", "max_score": 10, "weight": 20},
  {"name": "Aroma", "name_ar": "الرائحة", "max_score": 10, "weight": 15},
  {"name": "Cooking Versatility", "name_ar": "تعدد طرق الطهي", "max_score": 10, "weight": 15},
  {"name": "Value for Money", "name_ar": "القيمة مقابل السعر", "max_score": 10, "weight": 10},
  {"name": "Presentation & Packaging", "name_ar": "التقديم والتغليف", "max_score": 10, "weight": 15}
]'),
('Rice & Grains', 'الأرز والحبوب', 'rice', '[
  {"name": "Taste & Flavor", "name_ar": "المذاق والنكهة", "max_score": 10, "weight": 25},
  {"name": "Texture & Consistency", "name_ar": "القوام والتماسك", "max_score": 10, "weight": 25},
  {"name": "Cooking Quality", "name_ar": "جودة الطهي", "max_score": 10, "weight": 20},
  {"name": "Aroma", "name_ar": "الرائحة", "max_score": 10, "weight": 10},
  {"name": "Value for Money", "name_ar": "القيمة مقابل السعر", "max_score": 10, "weight": 10},
  {"name": "Packaging", "name_ar": "التغليف", "max_score": 10, "weight": 10}
]'),
('Spices & Seasonings', 'البهارات والتوابل', 'spices', '[
  {"name": "Aroma Intensity", "name_ar": "شدة الرائحة", "max_score": 10, "weight": 25},
  {"name": "Flavor Profile", "name_ar": "ملف النكهة", "max_score": 10, "weight": 25},
  {"name": "Color & Appearance", "name_ar": "اللون والمظهر", "max_score": 10, "weight": 15},
  {"name": "Versatility", "name_ar": "تعدد الاستخدامات", "max_score": 10, "weight": 15},
  {"name": "Quality & Freshness", "name_ar": "الجودة والطزاجة", "max_score": 10, "weight": 10},
  {"name": "Packaging", "name_ar": "التغليف", "max_score": 10, "weight": 10}
]'),
('Pasta & Noodles', 'المعكرونة والنودلز', 'pasta', '[
  {"name": "Taste & Flavor", "name_ar": "المذاق والنكهة", "max_score": 10, "weight": 25},
  {"name": "Texture & Al Dente", "name_ar": "القوام", "max_score": 10, "weight": 25},
  {"name": "Cooking Performance", "name_ar": "أداء الطهي", "max_score": 10, "weight": 20},
  {"name": "Versatility", "name_ar": "تعدد الاستخدامات", "max_score": 10, "weight": 10},
  {"name": "Value for Money", "name_ar": "القيمة مقابل السعر", "max_score": 10, "weight": 10},
  {"name": "Packaging", "name_ar": "التغليف", "max_score": 10, "weight": 10}
]'),
('General Products', 'منتجات عامة', 'general', '[
  {"name": "Taste & Flavor", "name_ar": "المذاق والنكهة", "max_score": 10, "weight": 25},
  {"name": "Texture", "name_ar": "القوام", "max_score": 10, "weight": 20},
  {"name": "Aroma", "name_ar": "الرائحة", "max_score": 10, "weight": 15},
  {"name": "Versatility", "name_ar": "تعدد الاستخدامات", "max_score": 10, "weight": 15},
  {"name": "Value for Money", "name_ar": "القيمة مقابل السعر", "max_score": 10, "weight": 15},
  {"name": "Packaging & Presentation", "name_ar": "التغليف والتقديم", "max_score": 10, "weight": 10}
]');
