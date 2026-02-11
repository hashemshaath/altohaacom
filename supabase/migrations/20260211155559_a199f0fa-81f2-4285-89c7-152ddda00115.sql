
-- Create mentee enrollments table for tracking program enrollment requests
CREATE TABLE public.mentee_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.mentorship_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  goals_description TEXT,
  experience_level TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, user_id)
);

ALTER TABLE public.mentee_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments" ON public.mentee_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own enrollments" ON public.mentee_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all enrollments" ON public.mentee_enrollments FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update enrollments" ON public.mentee_enrollments FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_mentee_enrollments_updated_at BEFORE UPDATE ON public.mentee_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
