
-- Masterclasses table
CREATE TABLE public.masterclasses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  instructor_id UUID NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  is_free BOOLEAN DEFAULT true,
  max_enrollments INTEGER,
  duration_hours NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_self_paced BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'cancelled')),
  tags TEXT[] DEFAULT '{}',
  prerequisites TEXT,
  prerequisites_ar TEXT,
  what_you_learn TEXT[] DEFAULT '{}',
  what_you_learn_ar TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Modules within a masterclass
CREATE TABLE public.masterclass_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  masterclass_id UUID NOT NULL REFERENCES public.masterclasses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lessons within a module
CREATE TABLE public.masterclass_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.masterclass_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  content TEXT,
  content_ar TEXT,
  content_type TEXT NOT NULL DEFAULT 'video' CHECK (content_type IN ('video', 'article', 'quiz', 'resource')),
  video_url TEXT,
  duration_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  resources JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enrollments
CREATE TABLE public.masterclass_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  masterclass_id UUID NOT NULL REFERENCES public.masterclasses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percent NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  certificate_issued BOOLEAN DEFAULT false,
  UNIQUE(masterclass_id, user_id)
);

-- Lesson progress tracking
CREATE TABLE public.masterclass_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.masterclass_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.masterclass_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_position_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

-- Helper function (created AFTER tables exist)
CREATE OR REPLACE FUNCTION public.is_free_preview(p_module_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.masterclass_modules
    WHERE id = p_module_id AND is_free_preview = true
  );
$$;

-- Enable RLS
ALTER TABLE public.masterclasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masterclass_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masterclass_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masterclass_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masterclass_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Masterclasses policies
CREATE POLICY "Anyone can view published masterclasses" ON public.masterclasses FOR SELECT
  USING (status = 'published' OR instructor_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Instructors can create masterclasses" ON public.masterclasses FOR INSERT
  WITH CHECK (auth.uid() = instructor_id);
CREATE POLICY "Instructors can update their masterclasses" ON public.masterclasses FOR UPDATE
  USING (instructor_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Admins can delete masterclasses" ON public.masterclasses FOR DELETE
  USING (is_admin(auth.uid()));

-- Modules policies
CREATE POLICY "Anyone can view modules of published masterclasses" ON public.masterclass_modules FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.masterclasses WHERE id = masterclass_modules.masterclass_id AND (status = 'published' OR instructor_id = auth.uid() OR is_admin(auth.uid()))));
CREATE POLICY "Instructors can manage their modules" ON public.masterclass_modules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.masterclasses WHERE id = masterclass_modules.masterclass_id AND (instructor_id = auth.uid() OR is_admin(auth.uid()))));

-- Lessons policies
CREATE POLICY "Enrolled users can view lessons" ON public.masterclass_lessons FOR SELECT
  USING (
    public.is_free_preview(module_id)
    OR EXISTS (SELECT 1 FROM public.masterclass_modules m JOIN public.masterclasses mc ON mc.id = m.masterclass_id WHERE m.id = masterclass_lessons.module_id AND (mc.instructor_id = auth.uid() OR is_admin(auth.uid())))
    OR EXISTS (SELECT 1 FROM public.masterclass_modules m JOIN public.masterclass_enrollments e ON e.masterclass_id = m.masterclass_id WHERE m.id = masterclass_lessons.module_id AND e.user_id = auth.uid() AND e.status = 'active')
  );
CREATE POLICY "Instructors can manage their lessons" ON public.masterclass_lessons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.masterclass_modules m JOIN public.masterclasses mc ON mc.id = m.masterclass_id WHERE m.id = masterclass_lessons.module_id AND (mc.instructor_id = auth.uid() OR is_admin(auth.uid()))));

-- Enrollments policies
CREATE POLICY "Users can view their enrollments" ON public.masterclass_enrollments FOR SELECT
  USING (user_id = auth.uid() OR is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.masterclasses WHERE id = masterclass_enrollments.masterclass_id AND instructor_id = auth.uid()));
CREATE POLICY "Users can enroll" ON public.masterclass_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their enrollment" ON public.masterclass_enrollments FOR UPDATE
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Lesson progress policies
CREATE POLICY "Users can view their progress" ON public.masterclass_lesson_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.masterclass_enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR is_admin(auth.uid()))));
CREATE POLICY "Users can track their progress" ON public.masterclass_lesson_progress FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.masterclass_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));
CREATE POLICY "Users can update their progress" ON public.masterclass_lesson_progress FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.masterclass_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_masterclasses_status ON public.masterclasses(status);
CREATE INDEX idx_masterclasses_instructor ON public.masterclasses(instructor_id);
CREATE INDEX idx_modules_masterclass ON public.masterclass_modules(masterclass_id);
CREATE INDEX idx_lessons_module ON public.masterclass_lessons(module_id);
CREATE INDEX idx_enrollments_user ON public.masterclass_enrollments(user_id);
CREATE INDEX idx_enrollments_masterclass ON public.masterclass_enrollments(masterclass_id);
CREATE INDEX idx_progress_enrollment ON public.masterclass_lesson_progress(enrollment_id);

-- Triggers
CREATE TRIGGER update_masterclasses_updated_at BEFORE UPDATE ON public.masterclasses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.masterclass_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.masterclass_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.masterclass_lesson_progress;
