-- 1. Add content_writer to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_writer';

-- 2. Add content-focused permissions
INSERT INTO public.permissions (code, name, name_ar, description, description_ar, category) VALUES
  ('content.create_article', 'Create Articles', 'إنشاء مقالات', 'Create and publish articles and blog posts', 'إنشاء ونشر المقالات والتدوينات', 'content'),
  ('content.edit_article', 'Edit Articles', 'تعديل مقالات', 'Edit existing articles and content', 'تعديل المقالات والمحتوى الموجود', 'content'),
  ('content.manage_seo', 'Manage SEO', 'إدارة تحسين محركات البحث', 'Optimize SEO settings, meta tags, and keywords', 'تحسين إعدادات السيو والعلامات الوصفية والكلمات المفتاحية', 'content'),
  ('content.manage_entities', 'Manage Entities', 'إدارة الكيانات', 'Add and edit culinary entities and associations', 'إضافة وتعديل الكيانات والجمعيات الطهوية', 'content'),
  ('content.manage_chefs', 'Manage Chef Profiles', 'إدارة ملفات الشيفات', 'Add and edit chef profiles and biographies', 'إضافة وتعديل ملفات وسير الشيفات', 'content'),
  ('content.manage_companies', 'Manage Companies', 'إدارة الشركات', 'Add and edit company profiles and information', 'إضافة وتعديل ملفات ومعلومات الشركات', 'content'),
  ('content.manage_establishments', 'Manage Establishments', 'إدارة المنشآت', 'Add and edit establishments like restaurants and hotels', 'إضافة وتعديل المنشآت كالمطاعم والفنادق', 'content'),
  ('content.manage_homepage', 'Manage Homepage', 'إدارة الصفحة الرئيسية', 'Edit homepage sections, hero slides, and covers', 'تعديل أقسام الصفحة الرئيسية والشرائح والأغلفة', 'content'),
  ('content.manage_media', 'Manage Media', 'إدارة الوسائط', 'Upload and manage media files and galleries', 'رفع وإدارة ملفات الوسائط والمعارض', 'content'),
  ('content.translate', 'Translate Content', 'ترجمة المحتوى', 'Translate content between Arabic and English', 'ترجمة المحتوى بين العربية والإنجليزية', 'content')
ON CONFLICT (code) DO NOTHING;