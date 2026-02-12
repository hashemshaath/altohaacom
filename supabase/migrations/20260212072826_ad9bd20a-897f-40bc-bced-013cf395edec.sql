
-- =============================================
-- SEO & Translation Configuration Tables
-- =============================================

-- 1. Translatable Fields Registry
CREATE TABLE public.seo_translatable_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_name_ar TEXT NOT NULL,
  label TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  category TEXT NOT NULL,
  max_length INTEGER NOT NULL DEFAULT 500,
  is_required BOOLEAN NOT NULL DEFAULT false,
  seo_optimize BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  description_ar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(table_name, field_name)
);

ALTER TABLE public.seo_translatable_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_fields_select" ON public.seo_translatable_fields FOR SELECT USING (true);
CREATE POLICY "seo_fields_admin" ON public.seo_translatable_fields FOR ALL USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'organizer'));

-- 2. SEO Rules & Constraints
CREATE TABLE public.seo_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_scope TEXT NOT NULL DEFAULT 'all',
  rule_text TEXT NOT NULL,
  rule_text_ar TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('error', 'warning', 'info')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.seo_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_rules_select" ON public.seo_rules FOR SELECT USING (true);
CREATE POLICY "seo_rules_admin" ON public.seo_rules FOR ALL USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'organizer'));

-- 3. AI Models Configuration
CREATE TABLE public.seo_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  display_name_ar TEXT,
  provider TEXT NOT NULL DEFAULT 'lovable',
  description TEXT,
  description_ar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  capabilities TEXT[] DEFAULT ARRAY['translate', 'optimize']::TEXT[],
  max_tokens INTEGER DEFAULT 4096,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.seo_ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_models_select" ON public.seo_ai_models FOR SELECT USING (true);
CREATE POLICY "seo_models_admin" ON public.seo_ai_models FOR ALL USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'organizer'));

-- 4. Content Sources (where fields come from)
CREATE TABLE public.seo_content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  icon TEXT DEFAULT 'FileText',
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.seo_content_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_sources_select" ON public.seo_content_sources FOR SELECT USING (true);
CREATE POLICY "seo_sources_admin" ON public.seo_content_sources FOR ALL USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'organizer'));

-- Triggers for updated_at
CREATE TRIGGER update_seo_fields_ts BEFORE UPDATE ON public.seo_translatable_fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seo_rules_ts BEFORE UPDATE ON public.seo_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seo_models_ts BEFORE UPDATE ON public.seo_ai_models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seo_sources_ts BEFORE UPDATE ON public.seo_content_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Seed default data
-- =============================================

-- Seed content sources
INSERT INTO public.seo_content_sources (source_key, name, name_ar, icon, color, sort_order) VALUES
  ('competitions', 'Competitions', 'المسابقات', 'Trophy', '#ef4444', 1),
  ('articles', 'Articles & News', 'المقالات والأخبار', 'FileText', '#3b82f6', 2),
  ('companies', 'Companies', 'الشركات', 'Building2', '#8b5cf6', 3),
  ('entities', 'Entities', 'الجهات', 'Landmark', '#f59e0b', 4),
  ('exhibitions', 'Exhibitions', 'المعارض', 'CalendarDays', '#10b981', 5),
  ('certificates', 'Certificates', 'الشهادات', 'Award', '#06b6d4', 6),
  ('advertising', 'Advertising', 'الإعلانات', 'Megaphone', '#ec4899', 7),
  ('communications', 'Communications', 'الاتصالات', 'Mail', '#6366f1', 8);

-- Seed AI models
INSERT INTO public.seo_ai_models (model_id, display_name, display_name_ar, provider, description, description_ar, is_default, capabilities, sort_order) VALUES
  ('google/gemini-3-flash-preview', 'Gemini 3 Flash', 'جيميناي 3 فلاش', 'lovable', 'Fast balanced model for translation and SEO', 'نموذج سريع ومتوازن للترجمة وتحسين المحتوى', true, ARRAY['translate', 'optimize', 'summarize'], 1),
  ('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'جيميناي 2.5 فلاش', 'lovable', 'Cost-effective for bulk translation', 'فعال من حيث التكلفة للترجمة بالجملة', false, ARRAY['translate', 'optimize'], 2),
  ('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'جيميناي 2.5 برو', 'lovable', 'Highest quality for complex content', 'أعلى جودة للمحتوى المعقد', false, ARRAY['translate', 'optimize', 'summarize', 'rewrite'], 3),
  ('openai/gpt-5-mini', 'GPT-5 Mini', 'جي بي تي 5 ميني', 'lovable', 'Strong reasoning for nuanced translations', 'استدلال قوي للترجمات الدقيقة', false, ARRAY['translate', 'optimize', 'rewrite'], 4);

-- Seed translatable fields
INSERT INTO public.seo_translatable_fields (table_name, field_name, field_name_ar, label, label_ar, category, max_length, is_required, seo_optimize, description, description_ar, sort_order) VALUES
  ('competitions', 'name', 'name_ar', 'Competition Name', 'اسم المسابقة', 'competitions', 120, true, true, 'Main competition title for SEO and display', 'عنوان المسابقة الرئيسي للعرض ومحركات البحث', 1),
  ('competitions', 'description', 'description_ar', 'Competition Description', 'وصف المسابقة', 'competitions', 500, true, true, 'Description used in meta tags and listings', 'الوصف المستخدم في وسوم ميتا والقوائم', 2),
  ('competitions', 'location', 'location_ar', 'Competition Location', 'موقع المسابقة', 'competitions', 200, false, false, 'Physical or virtual venue', 'المكان الفعلي أو الافتراضي', 3),
  ('articles', 'title', 'title_ar', 'Article Title', 'عنوان المقال', 'articles', 60, true, true, 'SEO-optimized title under 60 characters', 'عنوان محسّن لمحركات البحث أقل من 60 حرف', 4),
  ('articles', 'excerpt', 'excerpt_ar', 'Article Excerpt', 'مقتطف المقال', 'articles', 160, true, true, 'Meta description under 160 characters', 'وصف ميتا أقل من 160 حرف', 5),
  ('articles', 'content', 'content_ar', 'Article Content', 'محتوى المقال', 'articles', 50000, true, false, 'Full article body content', 'محتوى المقال الكامل', 6),
  ('companies', 'name', 'name_ar', 'Company Name', 'اسم الشركة', 'companies', 150, true, true, 'Company display name', 'اسم الشركة للعرض', 7),
  ('companies', 'description', 'description_ar', 'Company Description', 'وصف الشركة', 'companies', 500, false, true, 'Company profile description', 'وصف ملف الشركة', 8),
  ('culinary_entities', 'name', 'name_ar', 'Entity Name', 'اسم الجهة', 'entities', 200, true, true, 'Organization or entity name', 'اسم الجهة أو المنظمة', 9),
  ('culinary_entities', 'description', 'description_ar', 'Entity Description', 'وصف الجهة', 'entities', 500, false, true, 'Entity profile description', 'وصف ملف الجهة', 10),
  ('exhibitions', 'name', 'name_ar', 'Exhibition Name', 'اسم المعرض', 'exhibitions', 150, true, true, 'Exhibition title for SEO', 'عنوان المعرض لمحركات البحث', 11),
  ('exhibitions', 'description', 'description_ar', 'Exhibition Description', 'وصف المعرض', 'exhibitions', 500, false, true, 'Exhibition description for meta', 'وصف المعرض لوسوم ميتا', 12),
  ('certificate_templates', 'title_text', 'title_text_ar', 'Certificate Title', 'عنوان الشهادة', 'certificates', 200, true, false, 'Certificate heading text', 'نص عنوان الشهادة', 13),
  ('certificate_templates', 'body_template', 'body_template_ar', 'Certificate Body', 'نص الشهادة', 'certificates', 2000, true, false, 'Certificate body content template', 'قالب محتوى نص الشهادة', 14),
  ('ad_campaigns', 'name', 'name_ar', 'Campaign Name', 'اسم الحملة', 'advertising', 150, true, false, 'Advertising campaign name', 'اسم الحملة الإعلانية', 15),
  ('communication_templates', 'name', 'name_ar', 'Template Name', 'اسم القالب', 'communications', 150, true, false, 'Communication template name', 'اسم قالب الاتصال', 16),
  ('communication_templates', 'subject', 'subject_ar', 'Template Subject', 'موضوع القالب', 'communications', 200, false, false, 'Email subject line', 'سطر موضوع البريد', 17);

-- Seed SEO rules
INSERT INTO public.seo_rules (field_scope, rule_text, rule_text_ar, severity, is_enabled, sort_order) VALUES
  ('title', 'Title must be under 60 characters for optimal SEO display', 'يجب أن يكون العنوان أقل من 60 حرفاً لعرض أمثل في محركات البحث', 'error', true, 1),
  ('description', 'Meta description must be 120-160 characters', 'وصف ميتا يجب أن يكون بين 120 و160 حرفاً', 'error', true, 2),
  ('all', 'No Markdown or special characters (**, ##) allowed in translated text', 'لا يُسمح بعلامات Markdown أو الأحرف الخاصة في النص المترجم', 'error', true, 3),
  ('title', 'Title and description must not be identical', 'يجب ألا يتطابق العنوان والوصف', 'warning', true, 4),
  ('title', 'Primary keyword should appear in the first 30 characters', 'يجب أن تظهر الكلمة الرئيسية في أول 30 حرفاً من العنوان', 'warning', true, 5),
  ('all', 'Text must have proper spacing without extra whitespace', 'يجب أن يكون النص منسق بمسافات صحيحة بدون مسافات زائدة', 'info', true, 6),
  ('all', 'Arabic text must be professionally written with correct grammar', 'يجب أن يكون النص العربي مكتوباً بشكل احترافي مع قواعد نحوية صحيحة', 'error', true, 7),
  ('all', 'Do not mix languages within a single field unless brand names', 'لا تخلط اللغات داخل حقل مترجم واحد إلا لأسماء العلامات التجارية', 'warning', true, 8);
