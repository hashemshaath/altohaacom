
-- Add evaluation category and type to tasting_sessions
ALTER TABLE public.tasting_sessions
  ADD COLUMN IF NOT EXISTS evaluation_category text DEFAULT 'culinary',
  ADD COLUMN IF NOT EXISTS evaluation_type text DEFAULT null,
  ADD COLUMN IF NOT EXISTS round text DEFAULT null;

-- Add stage, guidelines, reference images to tasting_criteria
ALTER TABLE public.tasting_criteria
  ADD COLUMN IF NOT EXISTS stage text DEFAULT null,
  ADD COLUMN IF NOT EXISTS guidelines text DEFAULT null,
  ADD COLUMN IF NOT EXISTS guidelines_ar text DEFAULT null,
  ADD COLUMN IF NOT EXISTS reference_images text[] DEFAULT null,
  ADD COLUMN IF NOT EXISTS eval_scale text DEFAULT null;

-- Add image_url to tasting_scores for photo evidence
ALTER TABLE public.tasting_scores
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT null;

-- Add multiple images per entry
ALTER TABLE public.tasting_entries
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT null,
  ADD COLUMN IF NOT EXISTS stage text DEFAULT null;

-- Create score images table for multiple images per score
CREATE TABLE IF NOT EXISTS public.tasting_score_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  score_id uuid NOT NULL REFERENCES public.tasting_scores(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  caption_ar text,
  stage text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasting_score_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Score images viewable by session participants"
  ON public.tasting_score_images FOR SELECT USING (true);

CREATE POLICY "Judges can insert score images"
  ON public.tasting_score_images FOR INSERT WITH CHECK (true);

-- Seed professional presets for coffee, barista, beverages, decoration, dishes

-- WLAC Latte Art - Visual Assessment
INSERT INTO public.tasting_criteria_presets (preset_name, preset_name_ar, category, is_system, criteria) VALUES
(
  'WLAC Latte Art - Visual',
  'بطولة لاتيه آرت - التقييم البصري',
  'coffee',
  true,
  '[
    {"name":"Identical Patterns","name_ar":"أنماط متطابقة","description":"Two identical patterns matching the presented picture","max_score":6,"weight":2,"stage":"visual"},
    {"name":"Visual Foam Quality","name_ar":"جودة الرغوة البصرية","description":"Silky, creamy, shiny, glossy, no bubbles","max_score":6,"weight":2,"stage":"visual"},
    {"name":"Contrast & Definition","name_ar":"التباين والوضوح","description":"Clear defined lines, contrast between milk and espresso","max_score":6,"weight":2,"stage":"visual"},
    {"name":"Level of Difficulty","name_ar":"مستوى الصعوبة","description":"Symmetry, position, complexity of design","max_score":6,"weight":1,"stage":"visual"},
    {"name":"Successfully Achieved","name_ar":"النجاح في التنفيذ","description":"Mastery, surprising elements, expressionistic or realistic","max_score":6,"weight":4,"stage":"visual"},
    {"name":"Overall Impression","name_ar":"الانطباع العام","description":"Progressive, breakthrough, development of the craft","max_score":6,"weight":1,"stage":"visual"}
  ]'::jsonb
),
(
  'WLAC Latte Art - Technical',
  'بطولة لاتيه آرت - التقييم الفني',
  'coffee',
  true,
  '[
    {"name":"Espresso Preparation","name_ar":"تحضير الإسبريسو","description":"Flushes group head, dry/clean basket, consistent dosing, tamping, extraction time","max_score":6,"weight":4,"stage":"technical"},
    {"name":"Milk Steaming","name_ar":"تبخير الحليب","description":"Clean pitcher, purges wand before/after, acceptable milk waste","max_score":6,"weight":5,"stage":"technical"},
    {"name":"Hygiene","name_ar":"النظافة","description":"Steam wand cleanliness, pitcher hygiene, cloth usage","max_score":6,"weight":2,"stage":"technical"},
    {"name":"Workspace Organization","name_ar":"تنظيم مساحة العمل","description":"Clean at start and end, organized workflow","max_score":6,"weight":1,"stage":"technical"},
    {"name":"Overall Technical","name_ar":"التقنية العامة","description":"Grinder usage, extraction quality, milk technique, machine cleanliness","max_score":6,"weight":6,"stage":"technical"}
  ]'::jsonb
),
(
  'WLAC Latte Art - Performance',
  'بطولة لاتيه آرت - الأداء المهني',
  'coffee',
  true,
  '[
    {"name":"Professional Performance","name_ar":"الأداء المهني","description":"Hospitality skills, confidence, flair, eye contact","max_score":6,"weight":4,"stage":"performance"},
    {"name":"Professional Attire","name_ar":"المظهر المهني","description":"Appropriate professional clothing and presentation","max_score":6,"weight":1,"stage":"performance"},
    {"name":"Explanation & Communication","name_ar":"الشرح والتواصل","description":"Clear explanation of drinks, engagement with judges","max_score":6,"weight":1,"stage":"performance"},
    {"name":"Image Quality","name_ar":"جودة الصور المقدمة","description":"Quality of reference images presented","max_score":6,"weight":1,"stage":"performance"}
  ]'::jsonb
),
-- Barista Championship preset
(
  'Barista Championship',
  'بطولة الباريستا',
  'barista',
  true,
  '[
    {"name":"Espresso Taste Balance","name_ar":"توازن مذاق الإسبريسو","description":"Balance of sweetness, acidity, bitterness, and aftertaste","max_score":6,"weight":3,"stage":"visual"},
    {"name":"Milk Beverage","name_ar":"مشروب الحليب","description":"Milk texture, temperature, taste integration with espresso","max_score":6,"weight":3,"stage":"visual"},
    {"name":"Signature Drink","name_ar":"المشروب المميز","description":"Creativity, taste, presentation of signature beverage","max_score":6,"weight":4,"stage":"visual"},
    {"name":"Technical Skills","name_ar":"المهارات الفنية","description":"Grinder calibration, dosing, tamping, extraction","max_score":6,"weight":4,"stage":"technical"},
    {"name":"Workflow Efficiency","name_ar":"كفاءة سير العمل","description":"Organized workflow, time management, station management","max_score":6,"weight":2,"stage":"technical"},
    {"name":"Cleanliness & Hygiene","name_ar":"النظافة والصحة","description":"Station cleanliness, equipment maintenance, food safety","max_score":6,"weight":2,"stage":"technical"},
    {"name":"Presentation & Service","name_ar":"التقديم والخدمة","description":"Professional hospitality, judge interaction, confidence","max_score":6,"weight":3,"stage":"performance"}
  ]'::jsonb
),
-- Beverage Competition preset
(
  'Beverage & Mixology',
  'مسابقة المشروبات والمزج',
  'beverage',
  true,
  '[
    {"name":"Visual Presentation","name_ar":"التقديم البصري","description":"Glass selection, garnish, color, clarity, layering","max_score":10,"weight":2,"stage":"visual"},
    {"name":"Aroma","name_ar":"الرائحة","description":"Fragrance complexity, appeal, freshness","max_score":10,"weight":1,"stage":"visual"},
    {"name":"Taste Balance","name_ar":"توازن المذاق","description":"Sweet, sour, bitter, umami balance and harmony","max_score":10,"weight":3,"stage":"visual"},
    {"name":"Creativity & Innovation","name_ar":"الإبداع والابتكار","description":"Originality of recipe, ingredient combinations, technique","max_score":10,"weight":2,"stage":"technical"},
    {"name":"Preparation Technique","name_ar":"تقنية التحضير","description":"Mixing methods, precision, speed, cleanliness","max_score":10,"weight":2,"stage":"technical"},
    {"name":"Professional Service","name_ar":"الخدمة المهنية","description":"Hospitality, explanation, confidence, timing","max_score":10,"weight":1,"stage":"performance"}
  ]'::jsonb
),
-- Decoration & Plating preset
(
  'Decoration & Plating Art',
  'فن التزيين والتقديم',
  'decoration',
  true,
  '[
    {"name":"Color Harmony","name_ar":"انسجام الألوان","description":"Color palette coordination, contrast, visual appeal","max_score":10,"weight":2,"stage":"visual"},
    {"name":"Composition & Balance","name_ar":"التكوين والتوازن","description":"Plate layout, symmetry/asymmetry, use of space","max_score":10,"weight":2,"stage":"visual"},
    {"name":"Garnish Technique","name_ar":"تقنية التزيين","description":"Precision of garnish, edibility, relevance to dish","max_score":10,"weight":2,"stage":"technical"},
    {"name":"Height & Dimension","name_ar":"الارتفاع والأبعاد","description":"Three-dimensional presentation, structural integrity","max_score":10,"weight":1,"stage":"technical"},
    {"name":"Sauce Work","name_ar":"عمل الصلصات","description":"Sauce application technique, cleanliness, artistry","max_score":10,"weight":2,"stage":"technical"},
    {"name":"Innovation","name_ar":"الابتكار","description":"Creative use of techniques, modern vs traditional approach","max_score":10,"weight":1,"stage":"performance"},
    {"name":"Overall Artistic Merit","name_ar":"الجدارة الفنية الشاملة","description":"Total visual impact and professional quality","max_score":10,"weight":2,"stage":"performance"}
  ]'::jsonb
),
-- Local Dishes Assessment
(
  'Local & Traditional Dishes',
  'الأطباق المحلية والتقليدية',
  'local_dishes',
  true,
  '[
    {"name":"Authenticity","name_ar":"الأصالة","description":"Faithfulness to traditional recipe, regional identity","max_score":10,"weight":2,"stage":"visual"},
    {"name":"Ingredient Quality","name_ar":"جودة المكونات","description":"Freshness, sourcing, seasonal appropriateness","max_score":10,"weight":2,"stage":"visual"},
    {"name":"Traditional Technique","name_ar":"التقنية التقليدية","description":"Proper use of traditional cooking methods","max_score":10,"weight":2,"stage":"technical"},
    {"name":"Flavor Profile","name_ar":"ملف النكهة","description":"Seasoning, spice balance, depth of flavor","max_score":10,"weight":3,"stage":"technical"},
    {"name":"Presentation","name_ar":"التقديم","description":"Traditional or modern plating that honors the dish","max_score":10,"weight":1,"stage":"visual"},
    {"name":"Cultural Storytelling","name_ar":"السرد الثقافي","description":"Chef knowledge of dish history and cultural significance","max_score":10,"weight":1,"stage":"performance"},
    {"name":"International Adaptation","name_ar":"التكييف الدولي","description":"Potential for international appeal while maintaining identity","max_score":10,"weight":1,"stage":"performance"}
  ]'::jsonb
),
-- International Standards preset
(
  'International Culinary Standards',
  'المعايير الدولية للطهي',
  'international',
  true,
  '[
    {"name":"Mise en Place","name_ar":"تحضير المكونات","description":"Organization, preparation completeness, ingredient quality","max_score":10,"weight":1,"stage":"technical"},
    {"name":"Cooking Technique","name_ar":"تقنية الطهي","description":"Mastery of methods: searing, braising, sous vide, etc.","max_score":10,"weight":3,"stage":"technical"},
    {"name":"Flavor Development","name_ar":"تطوير النكهة","description":"Seasoning, sauce work, umami depth, balance","max_score":10,"weight":3,"stage":"technical"},
    {"name":"Visual Presentation","name_ar":"التقديم البصري","description":"Plating artistry, color, height, composition","max_score":10,"weight":2,"stage":"visual"},
    {"name":"Temperature","name_ar":"الحرارة","description":"Proper serving temperature for all components","max_score":10,"weight":1,"stage":"technical"},
    {"name":"Texture Contrast","name_ar":"تباين القوام","description":"Multiple textures creating interest and complexity","max_score":10,"weight":2,"stage":"visual"},
    {"name":"Innovation & Creativity","name_ar":"الابتكار والإبداع","description":"Original approach while respecting fundamentals","max_score":10,"weight":2,"stage":"performance"},
    {"name":"Hygiene & Safety","name_ar":"النظافة والسلامة","description":"Food safety compliance, workspace cleanliness","max_score":10,"weight":1,"stage":"technical"},
    {"name":"Time Management","name_ar":"إدارة الوقت","description":"Efficient workflow within allotted time","max_score":10,"weight":1,"stage":"performance"}
  ]'::jsonb
);
