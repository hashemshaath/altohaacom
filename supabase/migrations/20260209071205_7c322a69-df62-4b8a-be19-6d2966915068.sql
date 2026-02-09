-- =====================================================
-- Knowledge Center & Help System Tables
-- =====================================================

-- Knowledge articles table for AI-powered help
CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  content TEXT NOT NULL,
  content_ar TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- FAQ table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  question_ar TEXT,
  answer TEXT NOT NULL,
  answer_ar TEXT,
  category TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Notification System Tables
-- =====================================================

-- Notification types enum
CREATE TYPE public.notification_channel AS ENUM ('in_app', 'email', 'sms', 'whatsapp', 'push');
CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');

-- Notification templates
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_ar TEXT,
  body TEXT NOT NULL,
  body_ar TEXT,
  channels notification_channel[] DEFAULT '{in_app}',
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User notification preferences
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, channel)
);

-- Notifications table (for in-app notifications)
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  body TEXT NOT NULL,
  body_ar TEXT,
  type TEXT DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  channel notification_channel DEFAULT 'in_app',
  status notification_status DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Notification queue for external channels
CREATE TABLE public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  template_id UUID REFERENCES public.notification_templates(id),
  payload JSONB NOT NULL DEFAULT '{}',
  status notification_status DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- CMS Tables for News, Blog, Exhibitions
-- =====================================================

-- Content categories
CREATE TABLE public.content_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('news', 'blog', 'exhibition')),
  description TEXT,
  description_ar TEXT,
  parent_id UUID REFERENCES public.content_categories(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Content tags
CREATE TABLE public.content_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Articles/Content table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  excerpt_ar TEXT,
  content TEXT NOT NULL,
  content_ar TEXT,
  type TEXT NOT NULL CHECK (type IN ('news', 'blog', 'exhibition')),
  category_id UUID REFERENCES public.content_categories(id),
  author_id UUID REFERENCES auth.users(id),
  featured_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  event_start TIMESTAMP WITH TIME ZONE,
  event_end TIMESTAMP WITH TIME ZONE,
  event_location TEXT,
  event_location_ar TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Article tags junction table
CREATE TABLE public.article_tags (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Media library
CREATE TABLE public.media_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  alt_text TEXT,
  alt_text_ar TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  folder TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Landing Pages & Customer Management
-- =====================================================

-- Landing page leads (for sponsor/organization registrations)
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('sponsor', 'organization', 'user', 'partner')),
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Knowledge articles
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published articles" 
ON public.knowledge_articles FOR SELECT 
USING (status = 'published' OR author_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage articles" 
ON public.knowledge_articles FOR ALL 
USING (is_admin(auth.uid()));

-- FAQs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view FAQs" 
ON public.faqs FOR SELECT USING (true);

CREATE POLICY "Admins can manage FAQs" 
ON public.faqs FOR ALL 
USING (is_admin(auth.uid()));

-- Notification templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates" 
ON public.notification_templates FOR ALL 
USING (is_admin(auth.uid()));

-- Notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" 
ON public.notification_preferences FOR ALL 
USING (user_id = auth.uid());

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- Notification queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage queue" 
ON public.notification_queue FOR ALL 
USING (is_admin(auth.uid()));

-- Content categories
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" 
ON public.content_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.content_categories FOR ALL 
USING (is_admin(auth.uid()));

-- Content tags
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tags" 
ON public.content_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" 
ON public.content_tags FOR ALL 
USING (is_admin(auth.uid()));

-- Articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published articles" 
ON public.articles FOR SELECT 
USING (status = 'published' OR author_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Authors can create articles" 
ON public.articles FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own articles" 
ON public.articles FOR UPDATE 
USING (author_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete articles" 
ON public.articles FOR DELETE 
USING (is_admin(auth.uid()));

-- Article tags
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view article tags" 
ON public.article_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage article tags" 
ON public.article_tags FOR ALL 
USING (is_admin(auth.uid()));

-- Media library
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media" 
ON public.media_library FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload media" 
ON public.media_library FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own media" 
ON public.media_library FOR DELETE 
USING (uploaded_by = auth.uid() OR is_admin(auth.uid()));

-- Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leads" 
ON public.leads FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can create leads" 
ON public.leads FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- Triggers for updated_at
-- =====================================================

CREATE TRIGGER update_knowledge_articles_updated_at
BEFORE UPDATE ON public.knowledge_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Insert default notification templates
-- =====================================================

INSERT INTO public.notification_templates (name, title, title_ar, body, body_ar, channels, variables) VALUES
('registration_approved', 'Registration Approved', 'تمت الموافقة على التسجيل', 'Your registration for {{competition_name}} has been approved!', 'تمت الموافقة على تسجيلك في {{competition_name}}!', '{in_app,email}', '{competition_name}'),
('registration_rejected', 'Registration Rejected', 'تم رفض التسجيل', 'Your registration for {{competition_name}} was not approved.', 'لم تتم الموافقة على تسجيلك في {{competition_name}}.', '{in_app,email}', '{competition_name}'),
('new_competition', 'New Competition', 'مسابقة جديدة', 'A new competition "{{competition_name}}" is now open for registration!', 'مسابقة جديدة "{{competition_name}}" مفتوحة الآن للتسجيل!', '{in_app,email,push}', '{competition_name}'),
('score_posted', 'Score Posted', 'تم نشر النتيجة', 'Your scores for {{competition_name}} have been posted.', 'تم نشر نتائجك في {{competition_name}}.', '{in_app,email}', '{competition_name}'),
('welcome', 'Welcome to Altohaa', 'مرحباً بك في التُهاء', 'Welcome {{user_name}}! Start exploring culinary competitions.', 'مرحباً {{user_name}}! ابدأ في استكشاف مسابقات الطهي.', '{in_app,email}', '{user_name}');

-- Insert default FAQ categories
INSERT INTO public.content_categories (name, name_ar, slug, type, sort_order) VALUES
('Getting Started', 'البدء', 'getting-started', 'blog', 1),
('Competitions', 'المسابقات', 'competitions', 'news', 2),
('Culinary Events', 'الفعاليات الطهوية', 'culinary-events', 'exhibition', 3),
('Industry News', 'أخبار الصناعة', 'industry-news', 'news', 4),
('Chef Stories', 'قصص الطهاة', 'chef-stories', 'blog', 5);

-- Insert sample FAQs
INSERT INTO public.faqs (question, question_ar, answer, answer_ar, category, sort_order, is_featured) VALUES
('How do I register for a competition?', 'كيف أسجل في مسابقة؟', 'Navigate to the Competitions page, select the competition you want to join, and click the Register button. Fill out the required information and submit your application.', 'انتقل إلى صفحة المسابقات، اختر المسابقة التي تريد الانضمام إليها، وانقر على زر التسجيل. قم بملء المعلومات المطلوبة وأرسل طلبك.', 'competitions', 1, true),
('What are the judging criteria?', 'ما هي معايير التحكيم؟', 'Each competition has specific judging criteria set by the organizer. Common criteria include taste, presentation, creativity, and technique.', 'لكل مسابقة معايير تحكيم محددة يضعها المنظم. تشمل المعايير الشائعة الطعم والعرض والإبداع والتقنية.', 'competitions', 2, true),
('How do I become a judge?', 'كيف أصبح حكماً؟', 'Sign up with the Judge role and complete your profile. Competition organizers can then invite you to judge their events.', 'سجل بدور الحكم وأكمل ملفك الشخصي. يمكن لمنظمي المسابقات بعد ذلك دعوتك للتحكيم في فعالياتهم.', 'judging', 3, false),
('Can I organize my own competition?', 'هل يمكنني تنظيم مسابقتي الخاصة؟', 'Yes! Sign up as an Organizer and use our platform to create, manage, and run your culinary competitions.', 'نعم! سجل كمنظم واستخدم منصتنا لإنشاء وإدارة وتشغيل مسابقات الطهي الخاصة بك.', 'organizing', 4, true);