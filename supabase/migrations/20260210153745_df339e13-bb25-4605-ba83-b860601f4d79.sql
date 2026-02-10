
-- 1. Predefined competition types
CREATE TABLE public.competition_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.competition_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read competition types" ON public.competition_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage competition types" ON public.competition_types FOR ALL USING (public.is_admin(auth.uid()));

-- 2. Competition ↔ Type junction (many-to-many)
CREATE TABLE public.competition_type_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  type_id UUID NOT NULL REFERENCES public.competition_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, type_id)
);
ALTER TABLE public.competition_type_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read type assignments" ON public.competition_type_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage type assignments" ON public.competition_type_assignments FOR ALL USING (public.is_admin(auth.uid()));

-- 3. Predefined category templates (master list)
CREATE TABLE public.predefined_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID REFERENCES public.competition_types(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  gender TEXT DEFAULT 'mixed',
  default_max_participants INT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.predefined_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read predefined categories" ON public.predefined_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage predefined categories" ON public.predefined_categories FOR ALL USING (public.is_admin(auth.uid()));

-- 4. Competition supervising/sanctioning bodies (junction with entities)
CREATE TABLE public.competition_supervising_bodies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.culinary_entities(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'supervisor',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, entity_id)
);
ALTER TABLE public.competition_supervising_bodies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read supervising bodies" ON public.competition_supervising_bodies FOR SELECT USING (true);
CREATE POLICY "Admins can manage supervising bodies" ON public.competition_supervising_bodies FOR ALL USING (public.is_admin(auth.uid()));

-- 5. Company role assignments (allow multi-role: sponsor + partner + supplier etc.)
CREATE TABLE public.company_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, role)
);
ALTER TABLE public.company_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read company roles" ON public.company_role_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage company roles" ON public.company_role_assignments FOR ALL USING (public.is_admin(auth.uid()));

-- 6. Seed predefined competition types
INSERT INTO public.competition_types (name, name_ar, description, description_ar, icon, sort_order) VALUES
  ('Live Cooking', 'الطهي الحي', 'On-site cooking competitions with time limits', 'مسابقات الطهي الحي في الموقع مع حدود زمنية', 'flame', 1),
  ('Pastry & Bakery', 'الحلويات والمخبوزات', 'Desserts, cakes, bread, and pastry arts', 'الحلويات والكعك والخبز وفنون المعجنات', 'cake', 2),
  ('Display/Static', 'العرض الثابت', 'Pre-prepared dishes judged on presentation', 'أطباق محضرة مسبقاً يتم تقييمها على أساس العرض', 'eye', 3),
  ('Virtual/Online', 'افتراضي/عبر الإنترنت', 'Remote competitions with video submissions', 'مسابقات عن بعد مع تقديم فيديو', 'monitor', 4);

-- 7. Seed predefined categories per type
INSERT INTO public.predefined_categories (type_id, name, name_ar, description, description_ar, gender, sort_order)
SELECT t.id, c.name, c.name_ar, c.description, c.description_ar, c.gender, c.sort_order
FROM public.competition_types t
CROSS JOIN (VALUES
  -- Live Cooking categories
  ('Live Cooking', 'Main Course', 'الطبق الرئيسي', 'Hot main course preparation', 'تحضير الطبق الرئيسي الساخن', 'mixed', 1),
  ('Live Cooking', 'Appetizer', 'المقبلات', 'Cold and hot appetizers', 'مقبلات باردة وساخنة', 'mixed', 2),
  ('Live Cooking', 'Soup', 'الشوربة', 'Soup preparation', 'تحضير الشوربة', 'mixed', 3),
  ('Live Cooking', 'National Cuisine', 'المطبخ الوطني', 'Traditional national dishes', 'أطباق وطنية تقليدية', 'mixed', 4),
  ('Live Cooking', 'Junior Chef', 'الشيف الناشئ', 'For chefs under 25', 'للطهاة تحت 25 سنة', 'mixed', 5),
  ('Pastry & Bakery', 'Wedding Cake', 'كعكة الزفاف', 'Multi-tier wedding cake design', 'تصميم كعكة زفاف متعددة الطبقات', 'mixed', 1),
  ('Pastry & Bakery', 'Petit Fours', 'حلويات صغيرة', 'Small pastries and confections', 'معجنات وحلويات صغيرة', 'mixed', 2),
  ('Pastry & Bakery', 'Chocolate Showpiece', 'عرض الشوكولاتة', 'Artistic chocolate sculptures', 'منحوتات شوكولاتة فنية', 'mixed', 3),
  ('Pastry & Bakery', 'Artisan Bread', 'الخبز الحرفي', 'Artisan bread baking', 'خبز حرفي', 'mixed', 4),
  ('Display/Static', 'Cold Display', 'العرض البارد', 'Cold plated presentation', 'عرض أطباق باردة', 'mixed', 1),
  ('Display/Static', 'Hot Display', 'العرض الساخن', 'Hot plated presentation', 'عرض أطباق ساخنة', 'mixed', 2),
  ('Display/Static', 'Fruit & Vegetable Carving', 'نحت الفواكه والخضروات', 'Artistic carving', 'نحت فني', 'mixed', 3),
  ('Display/Static', 'Sugar Art', 'فن السكر', 'Sugar showpiece creation', 'إنشاء عرض سكري', 'mixed', 4),
  ('Virtual/Online', 'Home Cooking', 'الطبخ المنزلي', 'Home-style cooking challenge', 'تحدي الطبخ المنزلي', 'mixed', 1),
  ('Virtual/Online', 'Recipe Video', 'فيديو الوصفة', 'Best recipe video presentation', 'أفضل عرض فيديو للوصفة', 'mixed', 2),
  ('Virtual/Online', 'Innovation Challenge', 'تحدي الابتكار', 'Creative and innovative dishes', 'أطباق إبداعية ومبتكرة', 'mixed', 3)
) AS c(type_name, name, name_ar, description, description_ar, gender, sort_order)
WHERE t.name = c.type_name;
