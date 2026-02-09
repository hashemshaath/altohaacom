
-- Knowledge resource categories
CREATE TABLE public.knowledge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  icon TEXT DEFAULT 'folder',
  parent_id UUID REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view knowledge categories" ON public.knowledge_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge categories" ON public.knowledge_categories FOR ALL USING (is_admin(auth.uid()));

-- Knowledge resources (links, files, documents, laws, etc.)
CREATE TABLE public.knowledge_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('link', 'file', 'document', 'image', 'video', 'law', 'scraped_content')),
  url TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  scraped_content TEXT,
  scraped_content_ar TEXT,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  is_judge_resource BOOLEAN DEFAULT false,
  added_by UUID,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published resources" ON public.knowledge_resources FOR SELECT USING (is_published = true OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage resources" ON public.knowledge_resources FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Judges can add resources" ON public.knowledge_resources FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'judge') AND auth.uid() = added_by
);
CREATE POLICY "Judges can update own resources" ON public.knowledge_resources FOR UPDATE USING (
  auth.uid() = added_by AND has_role(auth.uid(), 'judge')
);

-- Reference gallery for judges
CREATE TABLE public.reference_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  competition_category TEXT,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT NOT NULL,
  rating TEXT CHECK (rating IN ('excellent', 'good', 'average', 'poor')),
  score_range_min NUMERIC,
  score_range_max NUMERIC,
  tags TEXT[] DEFAULT '{}',
  added_by UUID,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reference_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active references" ON public.reference_gallery FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage references" ON public.reference_gallery FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Judges can add references" ON public.reference_gallery FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'judge') AND auth.uid() = added_by
);

-- Judging rubric templates (reusable across competitions)
CREATE TABLE public.judging_rubric_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  competition_type TEXT,
  category_type TEXT,
  criteria JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.judging_rubric_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rubrics" ON public.judging_rubric_templates FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage rubrics" ON public.judging_rubric_templates FOR ALL USING (is_admin(auth.uid()));

-- Judge AI chat history
CREATE TABLE public.judge_ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  context_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view own conversations" ON public.judge_ai_conversations FOR SELECT USING (auth.uid() = judge_id);
CREATE POLICY "Judges can create conversations" ON public.judge_ai_conversations FOR INSERT WITH CHECK (auth.uid() = judge_id);
CREATE POLICY "Judges can update own conversations" ON public.judge_ai_conversations FOR UPDATE USING (auth.uid() = judge_id);
CREATE POLICY "Admins can view all conversations" ON public.judge_ai_conversations FOR SELECT USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_knowledge_categories_updated_at BEFORE UPDATE ON public.knowledge_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_resources_updated_at BEFORE UPDATE ON public.knowledge_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_judging_rubric_templates_updated_at BEFORE UPDATE ON public.judging_rubric_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_judge_ai_conversations_updated_at BEFORE UPDATE ON public.judge_ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for knowledge files
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-files', 'knowledge-files', true);

CREATE POLICY "Anyone can view knowledge files" ON storage.objects FOR SELECT USING (bucket_id = 'knowledge-files');
CREATE POLICY "Admins can upload knowledge files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'knowledge-files' AND is_admin(auth.uid()));
CREATE POLICY "Judges can upload knowledge files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'knowledge-files' AND has_role(auth.uid(), 'judge'));
CREATE POLICY "Admins can delete knowledge files" ON storage.objects FOR DELETE USING (bucket_id = 'knowledge-files' AND is_admin(auth.uid()));
