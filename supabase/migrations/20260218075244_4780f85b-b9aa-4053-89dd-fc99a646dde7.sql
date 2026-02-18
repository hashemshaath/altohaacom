
-- =====================================================
-- COMPREHENSIVE EVALUATION CRITERIA SYSTEM
-- Supports: Chef's Table, Competitions, Equipment, Tools
-- Based on WACS/WorldChefs, ACF, and ISO sensory standards
-- =====================================================

-- 1. Evaluation Domains (Chef's Table, Competition, Equipment, etc.)
CREATE TABLE public.evaluation_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ar TEXT,
  icon TEXT DEFAULT 'clipboard-check',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read evaluation domains" ON public.evaluation_domains FOR SELECT USING (true);
CREATE POLICY "Admin can manage evaluation domains" ON public.evaluation_domains FOR ALL USING (public.is_admin_user());

-- 2. Evaluation Criteria Categories (groups of criteria within a domain)
CREATE TABLE public.evaluation_criteria_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES public.evaluation_domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  product_category TEXT, -- NULL = applies to all, or specific: meat, beverage, spices, equipment, etc.
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_criteria_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read criteria categories" ON public.evaluation_criteria_categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage criteria categories" ON public.evaluation_criteria_categories FOR ALL USING (public.is_admin_user());

-- 3. Evaluation Criteria (individual scoring items)
CREATE TABLE public.evaluation_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.evaluation_criteria_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT, -- Guidance for judges
  description_ar TEXT,
  max_score NUMERIC NOT NULL DEFAULT 10,
  weight NUMERIC NOT NULL DEFAULT 1, -- Percentage weight within its category
  scoring_guide JSONB, -- { "0-2": "Poor", "3-4": "Below Average", ... }
  scoring_guide_ar JSONB,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read evaluation criteria" ON public.evaluation_criteria FOR SELECT USING (true);
CREATE POLICY "Admin can manage evaluation criteria" ON public.evaluation_criteria FOR ALL USING (public.is_admin_user());

-- 4. Evaluation Scores (actual scores given by judges/chefs)
CREATE TABLE public.evaluation_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_slug TEXT NOT NULL, -- 'chefs_table', 'competition', 'equipment'
  entity_id UUID NOT NULL, -- session_id, competition_id, etc.
  evaluator_id UUID NOT NULL,
  subject_id TEXT, -- participant_id, product_id, or invitation_id
  criterion_id UUID NOT NULL REFERENCES public.evaluation_criteria(id),
  score NUMERIC NOT NULL,
  notes TEXT,
  notes_ar TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, evaluator_id, subject_id, criterion_id)
);

ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Evaluators can read own scores" ON public.evaluation_scores FOR SELECT USING (evaluator_id = auth.uid() OR public.is_admin_user());
CREATE POLICY "Evaluators can insert own scores" ON public.evaluation_scores FOR INSERT WITH CHECK (evaluator_id = auth.uid());
CREATE POLICY "Evaluators can update own scores" ON public.evaluation_scores FOR UPDATE USING (evaluator_id = auth.uid());
CREATE POLICY "Admin full access scores" ON public.evaluation_scores FOR ALL USING (public.is_admin_user());

-- 5. Evaluation Reports (final aggregated reports)
CREATE TABLE public.evaluation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_slug TEXT NOT NULL,
  entity_id UUID NOT NULL,
  report_number TEXT,
  title TEXT NOT NULL,
  title_ar TEXT,
  summary TEXT,
  summary_ar TEXT,
  overall_score NUMERIC,
  category_scores JSONB DEFAULT '{}', -- { "taste": 8.5, "presentation": 7.2, ... }
  evaluator_count INTEGER DEFAULT 0,
  criteria_count INTEGER DEFAULT 0,
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
  generated_by UUID,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published reports are public" ON public.evaluation_reports FOR SELECT USING (status = 'published' OR public.is_admin_user());
CREATE POLICY "Admin can manage reports" ON public.evaluation_reports FOR ALL USING (public.is_admin_user());

-- Create indexes
CREATE INDEX idx_eval_criteria_category ON public.evaluation_criteria(category_id);
CREATE INDEX idx_eval_scores_entity ON public.evaluation_scores(entity_id);
CREATE INDEX idx_eval_scores_evaluator ON public.evaluation_scores(evaluator_id);
CREATE INDEX idx_eval_reports_entity ON public.evaluation_reports(entity_id);

-- Trigger for updated_at
CREATE TRIGGER update_evaluation_criteria_updated_at
BEFORE UPDATE ON public.evaluation_criteria
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluation_scores_updated_at
BEFORE UPDATE ON public.evaluation_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluation_reports_updated_at
BEFORE UPDATE ON public.evaluation_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED: Domains
-- =====================================================
INSERT INTO public.evaluation_domains (name, name_ar, slug, description, description_ar, icon, sort_order) VALUES
('Chef''s Table', 'طاولة الشيف', 'chefs_table', 'Product evaluation by professional chefs', 'تقييم المنتجات بواسطة الطهاة المحترفين', 'chef-hat', 1),
('Competition Judging', 'تحكيم المسابقات', 'competition', 'Culinary competition scoring (WACS/ACF standards)', 'تقييم المسابقات الطبخية (معايير WACS/ACF)', 'trophy', 2),
('Equipment & Tools', 'المعدات والأدوات', 'equipment', 'Professional kitchen equipment evaluation', 'تقييم معدات المطبخ الاحترافية', 'wrench', 3),
('Beverage', 'المشروبات', 'beverage', 'Beverage product sensory evaluation', 'التقييم الحسي لمنتجات المشروبات', 'coffee', 4);

-- =====================================================
-- SEED: Chef's Table criteria categories & criteria
-- =====================================================

-- MEAT Products
INSERT INTO public.evaluation_criteria_categories (domain_id, name, name_ar, product_category, sort_order)
VALUES (
  (SELECT id FROM public.evaluation_domains WHERE slug = 'chefs_table'),
  'Sensory Analysis', 'التحليل الحسي', 'meat', 1
);
INSERT INTO public.evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, scoring_guide, sort_order) VALUES
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'meat'), 'Appearance & Color', 'المظهر واللون', 'Visual appeal, natural color, marbling', 'الجاذبية البصرية، اللون الطبيعي، التوزيع الدهني', 10, 10, '{"0-3": "Poor/Unnatural", "4-5": "Below Average", "6-7": "Good", "8-9": "Very Good", "10": "Exceptional"}', 1),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'meat'), 'Aroma & Freshness', 'الرائحة والنضارة', 'Natural aroma, freshness indicators', 'الرائحة الطبيعية، مؤشرات النضارة', 10, 15, '{"0-3": "Off-odor", "4-5": "Mild", "6-7": "Pleasant", "8-9": "Rich", "10": "Exceptional"}', 2),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'meat'), 'Taste & Flavor Profile', 'المذاق وملف النكهة', 'Depth of flavor, umami, balance', 'عمق النكهة، الأومامي، التوازن', 10, 25, '{"0-3": "Bland/Off", "4-5": "Weak", "6-7": "Good Balance", "8-9": "Rich Complex", "10": "Outstanding"}', 3),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'meat'), 'Texture & Tenderness', 'القوام والطراوة', 'Tenderness, juiciness, mouthfeel', 'الطراوة، العصارة، الملمس في الفم', 10, 20, '{"0-3": "Tough/Dry", "4-5": "Firm", "6-7": "Tender", "8-9": "Very Tender", "10": "Melt-in-mouth"}', 4);

INSERT INTO public.evaluation_criteria_categories (domain_id, name, name_ar, product_category, sort_order)
VALUES (
  (SELECT id FROM public.evaluation_domains WHERE slug = 'chefs_table'),
  'Culinary Performance', 'الأداء الطهوي', 'meat', 2
);
INSERT INTO public.evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, scoring_guide, sort_order) VALUES
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Culinary Performance' AND product_category = 'meat'), 'Cooking Versatility', 'تعدد طرق الطهي', 'Suitability for various cooking methods', 'ملاءمة لطرق الطهي المختلفة', 10, 15, '{"0-3": "Limited", "4-5": "Moderate", "6-7": "Versatile", "8-9": "Highly Versatile", "10": "Exceptional"}', 1),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Culinary Performance' AND product_category = 'meat'), 'Yield & Shrinkage', 'العائد والانكماش', 'Minimal shrinkage, good yield after cooking', 'انكماش أدنى، عائد جيد بعد الطهي', 10, 10, '{"0-3": "High Shrink", "4-5": "Average", "6-7": "Good", "8-9": "Excellent", "10": "Minimal Loss"}', 2),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Culinary Performance' AND product_category = 'meat'), 'Value for Money', 'القيمة مقابل السعر', 'Price-to-quality ratio, market positioning', 'نسبة السعر للجودة، الموقع في السوق', 10, 5, '{"0-3": "Overpriced", "4-5": "Fair", "6-7": "Good Value", "8-9": "Great Value", "10": "Exceptional Value"}', 3);

-- BEVERAGE Products
INSERT INTO public.evaluation_criteria_categories (domain_id, name, name_ar, product_category, sort_order)
VALUES (
  (SELECT id FROM public.evaluation_domains WHERE slug = 'chefs_table'),
  'Sensory Analysis', 'التحليل الحسي', 'beverage', 1
);
INSERT INTO public.evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, scoring_guide, sort_order) VALUES
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'beverage'), 'Visual Clarity & Color', 'الصفاء واللون', 'Clarity, color intensity, visual appeal', 'الصفاء، شدة اللون، الجاذبية البصرية', 10, 10, '{"0-3": "Cloudy/Off", "4-5": "Acceptable", "6-7": "Clear", "8-9": "Brilliant", "10": "Perfect"}', 1),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'beverage'), 'Aroma Intensity & Complexity', 'شدة الرائحة والتعقيد', 'Bouquet, complexity of aroma notes', 'مجموعة الروائح، تعقيد النوتات العطرية', 10, 20, '{"0-3": "None/Off", "4-5": "Simple", "6-7": "Pleasant", "8-9": "Complex", "10": "Extraordinary"}', 2),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'beverage'), 'Taste Balance', 'توازن المذاق', 'Sweet, sour, bitter balance', 'توازن الحلو والحامض والمر', 10, 25, '{"0-3": "Unbalanced", "4-5": "Off-balance", "6-7": "Balanced", "8-9": "Well Balanced", "10": "Perfect Harmony"}', 3),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'beverage'), 'Mouthfeel & Body', 'ملمس الفم والقوام', 'Viscosity, carbonation, smoothness', 'اللزوجة، الفوران، النعومة', 10, 15, '{"0-3": "Thin/Harsh", "4-5": "Light", "6-7": "Medium", "8-9": "Full-bodied", "10": "Perfectly Structured"}', 4),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'beverage'), 'Aftertaste & Finish', 'المذاق اللاحق', 'Length and quality of finish', 'طول وجودة المذاق اللاحق', 10, 15, '{"0-3": "Unpleasant", "4-5": "Short", "6-7": "Clean", "8-9": "Long Pleasant", "10": "Memorable"}', 5),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'beverage'), 'Packaging & Presentation', 'التغليف والتقديم', 'Bottle/package design, labeling', 'تصميم العبوة/الزجاجة، البطاقات', 10, 15, '{"0-3": "Poor", "4-5": "Basic", "6-7": "Professional", "8-9": "Premium", "10": "Outstanding"}', 6);

-- SPICES Products
INSERT INTO public.evaluation_criteria_categories (domain_id, name, name_ar, product_category, sort_order)
VALUES (
  (SELECT id FROM public.evaluation_domains WHERE slug = 'chefs_table'),
  'Sensory Analysis', 'التحليل الحسي', 'spices', 1
);
INSERT INTO public.evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, scoring_guide, sort_order) VALUES
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'spices'), 'Aroma Potency', 'قوة الرائحة', 'Intensity of essential oils and aromatic compounds', 'شدة الزيوت الأساسية والمركبات العطرية', 10, 25, '{"0-3": "Faint/None", "4-5": "Mild", "6-7": "Moderate", "8-9": "Strong", "10": "Powerful & Clean"}', 1),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'spices'), 'Color & Visual Quality', 'اللون والجودة البصرية', 'Natural vibrant color, uniformity', 'لون طبيعي نابض بالحياة، التجانس', 10, 15, '{"0-3": "Dull/Off", "4-5": "Faded", "6-7": "Good", "8-9": "Vibrant", "10": "Exceptional"}', 2),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'spices'), 'Flavor Depth', 'عمق النكهة', 'Complexity and depth of flavor when used in cooking', 'تعقيد وعمق النكهة عند استخدامها في الطهي', 10, 25, '{"0-3": "Flat", "4-5": "One-note", "6-7": "Good depth", "8-9": "Complex layers", "10": "Extraordinary"}', 3),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'spices'), 'Purity & Freshness', 'النقاء والطازجية', 'Free from adulteration, freshness level', 'خالي من الغش، مستوى الطازجية', 10, 20, '{"0-3": "Stale/Adulterated", "4-5": "Average", "6-7": "Fresh", "8-9": "Very Fresh", "10": "Premium Pure"}', 4),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Sensory Analysis' AND product_category = 'spices'), 'Versatility', 'تعدد الاستخدامات', 'Applicability across cuisines and dishes', 'قابلية الاستخدام في المطابخ والأطباق المختلفة', 10, 15, '{"0-3": "Very Limited", "4-5": "Specific", "6-7": "Moderate", "8-9": "Wide Range", "10": "Universal"}', 5);

-- EQUIPMENT Domain criteria
INSERT INTO public.evaluation_criteria_categories (domain_id, name, name_ar, product_category, sort_order)
VALUES (
  (SELECT id FROM public.evaluation_domains WHERE slug = 'equipment'),
  'Performance', 'الأداء', NULL, 1
);
INSERT INTO public.evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, scoring_guide, sort_order) VALUES
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Performance' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'equipment')), 'Build Quality', 'جودة التصنيع', 'Materials, construction, durability', 'المواد، البناء، المتانة', 10, 20, '{"0-3": "Flimsy", "4-5": "Adequate", "6-7": "Solid", "8-9": "Professional", "10": "Commercial Grade"}', 1),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Performance' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'equipment')), 'Ease of Use', 'سهولة الاستخدام', 'Ergonomics, intuitive controls, learning curve', 'بيئة العمل، عناصر التحكم البديهية', 10, 20, '{"0-3": "Confusing", "4-5": "Requires Training", "6-7": "Intuitive", "8-9": "Very Easy", "10": "Effortless"}', 2),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Performance' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'equipment')), 'Efficiency & Output', 'الكفاءة والإنتاجية', 'Speed, energy efficiency, output quality', 'السرعة، كفاءة الطاقة، جودة الإنتاج', 10, 25, '{"0-3": "Slow/Wasteful", "4-5": "Average", "6-7": "Efficient", "8-9": "Very Efficient", "10": "Best in Class"}', 3),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Performance' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'equipment')), 'Cleaning & Maintenance', 'التنظيف والصيانة', 'Easy to clean, maintain, and service', 'سهولة التنظيف والصيانة والخدمة', 10, 15, '{"0-3": "Difficult", "4-5": "Time-consuming", "6-7": "Manageable", "8-9": "Easy", "10": "Self-cleaning"}', 4),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Performance' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'equipment')), 'Safety Features', 'ميزات الأمان', 'Safety certifications, guards, auto-shutoff', 'شهادات الأمان، الحماية، الإيقاف التلقائي', 10, 10, '{"0-3": "Unsafe", "4-5": "Basic", "6-7": "Standard", "8-9": "Advanced", "10": "Best in Class"}', 5),
((SELECT id FROM public.evaluation_criteria_categories WHERE name = 'Performance' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'equipment')), 'Value for Investment', 'القيمة مقابل الاستثمار', 'Price-to-performance, warranty, ROI', 'نسبة السعر للأداء، الضمان، العائد', 10, 10, '{"0-3": "Overpriced", "4-5": "Fair", "6-7": "Good Value", "8-9": "Great Value", "10": "Exceptional"}', 6);

-- COMPETITION Domain - WACS/ACF-based criteria
INSERT INTO public.evaluation_criteria_categories (domain_id, name, name_ar, product_category, sort_order)
VALUES 
(
  (SELECT id FROM public.evaluation_domains WHERE slug = 'competition'),
  'Mise en Place & Hygiene', 'التحضير والنظافة', NULL, 1
),
(
  (SELECT id FROM public.evaluation_domains WHERE slug = 'competition'),
  'Technical Skills', 'المهارات التقنية', NULL, 2
),
(
  (SELECT id FROM public.evaluation_domains WHERE slug = 'competition'),
  'Presentation', 'التقديم', NULL, 3
),
(
  (SELECT id FROM public.evaluation_domains WHERE slug = 'competition'),
  'Taste & Flavor', 'المذاق والنكهة', NULL, 4
);

-- Mise en Place criteria
INSERT INTO public.evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, sort_order) VALUES
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Mise en Place & Hygiene' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Work Organization', 'تنظيم العمل', 'Station setup, preparation plan, timing', 'إعداد المحطة، خطة التحضير، التوقيت', 10, 25, 1),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Mise en Place & Hygiene' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Cleanliness & Hygiene', 'النظافة والصحة', 'Personal hygiene, station cleanliness, HACCP compliance', 'النظافة الشخصية، نظافة المحطة، الامتثال لـ HACCP', 10, 25, 2),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Mise en Place & Hygiene' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Waste Management', 'إدارة النفايات', 'Minimal waste, proper disposal, sustainability', 'الحد الأدنى من الهدر، التخلص السليم', 10, 25, 3),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Mise en Place & Hygiene' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Time Management', 'إدارة الوقت', 'Efficient use of allotted time', 'الاستخدام الفعال للوقت المخصص', 10, 25, 4);

-- Technical Skills criteria
INSERT INTO public.evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, sort_order) VALUES
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Technical Skills' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Cooking Methods', 'طرق الطهي', 'Proper techniques, temperature control', 'التقنيات الصحيحة، التحكم في درجة الحرارة', 10, 30, 1),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Technical Skills' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Knife Skills', 'مهارات السكاكين', 'Precision cuts, uniformity, safety', 'القطع الدقيق، التجانس، الأمان', 10, 25, 2),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Technical Skills' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Menu Composition', 'تركيب القائمة', 'Balance, creativity, seasonal ingredients', 'التوازن، الإبداع، المكونات الموسمية', 10, 25, 3),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Technical Skills' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Innovation', 'الابتكار', 'Modern techniques, creative approaches', 'التقنيات الحديثة، الأساليب الإبداعية', 10, 20, 4);

-- Presentation criteria
INSERT INTO public.evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, sort_order) VALUES
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Presentation' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Plating & Visual Impact', 'التقديم والأثر البصري', 'Color harmony, height, flow', 'تناسق الألوان، الارتفاع، الانسياب', 10, 35, 1),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Presentation' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Portion Control', 'التحكم بالكمية', 'Appropriate portions, consistency', 'كميات مناسبة، تناسق', 10, 25, 2),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Presentation' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Garnish & Creativity', 'الزينة والإبداع', 'Edible, purposeful garnishes', 'زينة مأكولة وذات غرض', 10, 20, 3),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Presentation' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Overall Artistry', 'الفن العام', 'Cohesive artistic vision', 'رؤية فنية متماسكة', 10, 20, 4);

-- Taste & Flavor criteria
INSERT INTO public.evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, sort_order) VALUES
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Taste & Flavor' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Seasoning & Balance', 'التتبيل والتوازن', 'Proper seasoning, flavor balance', 'التتبيل المناسب، توازن النكهات', 10, 30, 1),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Taste & Flavor' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Texture Harmony', 'تناسق القوام', 'Multiple textures working together', 'تعدد القوام في تناغم', 10, 25, 2),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Taste & Flavor' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Temperature', 'درجة الحرارة', 'Hot items hot, cold items cold', 'الأطباق الساخنة ساخنة، الباردة باردة', 10, 20, 3),
((SELECT id FROM evaluation_criteria_categories WHERE name = 'Taste & Flavor' AND domain_id = (SELECT id FROM evaluation_domains WHERE slug = 'competition')), 'Overall Flavor Impact', 'التأثير الكلي للنكهة', 'Memorable flavor experience', 'تجربة نكهة لا تُنسى', 10, 25, 4);
