
-- Mentorship Programs (admin-defined)
CREATE TABLE public.mentorship_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  duration_weeks INTEGER DEFAULT 12,
  max_matches INTEGER DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  requirements TEXT,
  requirements_ar TEXT,
  cover_image_url TEXT,
  country_code CHAR(2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mentorship Matches (mentor-mentee pairings)
CREATE TABLE public.mentorship_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.mentorship_programs(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id),
  mentee_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  mentor_notes TEXT,
  mentee_notes TEXT,
  matched_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, mentor_id, mentee_id)
);

-- Mentorship Sessions
CREATE TABLE public.mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.mentorship_matches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_url TEXT,
  mentor_feedback TEXT,
  mentee_feedback TEXT,
  mentor_rating INTEGER CHECK (mentor_rating BETWEEN 1 AND 5),
  mentee_rating INTEGER CHECK (mentee_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mentorship Goals / Milestones
CREATE TABLE public.mentorship_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.mentorship_matches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  target_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dropped')),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mentor Applications (users apply to be mentors)
CREATE TABLE public.mentor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  program_id UUID REFERENCES public.mentorship_programs(id) ON DELETE SET NULL,
  expertise TEXT[] DEFAULT '{}',
  bio TEXT,
  bio_ar TEXT,
  years_experience INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentorship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

-- Programs: public read, admin write
CREATE POLICY "Anyone can view active programs" ON public.mentorship_programs
  FOR SELECT USING (status = 'active' OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage programs" ON public.mentorship_programs
  FOR ALL USING (public.is_admin(auth.uid()));

-- Matches: participants + admin
CREATE POLICY "Users can view own matches" ON public.mentorship_matches
  FOR SELECT USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage matches" ON public.mentorship_matches
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own matches" ON public.mentorship_matches
  FOR UPDATE USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

-- Sessions: participants + admin
CREATE POLICY "Users can view own sessions" ON public.mentorship_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.mentorship_matches m WHERE m.id = match_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Participants can manage sessions" ON public.mentorship_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.mentorship_matches m WHERE m.id = match_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

-- Goals: participants + admin
CREATE POLICY "Users can view own goals" ON public.mentorship_goals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.mentorship_matches m WHERE m.id = match_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Participants can manage goals" ON public.mentorship_goals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.mentorship_matches m WHERE m.id = match_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

-- Applications: own + admin
CREATE POLICY "Users can view own applications" ON public.mentor_applications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create own applications" ON public.mentor_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage applications" ON public.mentor_applications
  FOR ALL USING (public.is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_mentorship_programs_updated_at BEFORE UPDATE ON public.mentorship_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_matches_updated_at BEFORE UPDATE ON public.mentorship_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_sessions_updated_at BEFORE UPDATE ON public.mentorship_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_goals_updated_at BEFORE UPDATE ON public.mentorship_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
