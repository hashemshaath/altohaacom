
-- Exhibition surveys system
CREATE TABLE public.exhibition_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  survey_type TEXT NOT NULL DEFAULT 'post_event', -- post_event, during_event, general
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exhibition_survey_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.exhibition_surveys(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_ar TEXT,
  question_type TEXT NOT NULL DEFAULT 'rating', -- rating, text, multiple_choice, yes_no
  options JSONB, -- for multiple_choice
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exhibition_survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.exhibition_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

-- Exhibition loyalty points log
CREATE TABLE public.exhibition_loyalty_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- checkin, review, survey, share, booth_visit
  points_earned INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exhibition_id, action_type)
);

-- Enable RLS
ALTER TABLE public.exhibition_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibition_survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibition_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibition_loyalty_actions ENABLE ROW LEVEL SECURITY;

-- Surveys: public read, creator manage
CREATE POLICY "Anyone can view active surveys" ON public.exhibition_surveys FOR SELECT USING (is_active = true);
CREATE POLICY "Creators manage surveys" ON public.exhibition_surveys FOR ALL USING (
  EXISTS (SELECT 1 FROM exhibitions WHERE id = exhibition_id AND created_by = auth.uid()) OR public.is_admin_user()
);

-- Questions: public read
CREATE POLICY "Anyone can view survey questions" ON public.exhibition_survey_questions FOR SELECT USING (true);
CREATE POLICY "Creators manage questions" ON public.exhibition_survey_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM exhibition_surveys s JOIN exhibitions e ON e.id = s.exhibition_id WHERE s.id = survey_id AND e.created_by = auth.uid()) OR public.is_admin_user()
);

-- Responses: users manage own
CREATE POLICY "Users can view own responses" ON public.exhibition_survey_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit responses" ON public.exhibition_survey_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can view all responses" ON public.exhibition_survey_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM exhibition_surveys s JOIN exhibitions e ON e.id = s.exhibition_id WHERE s.id = survey_id AND e.created_by = auth.uid()) OR public.is_admin_user()
);

-- Loyalty: users view own, creators view all
CREATE POLICY "Users view own loyalty" ON public.exhibition_loyalty_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users earn loyalty" ON public.exhibition_loyalty_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators view loyalty" ON public.exhibition_loyalty_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM exhibitions WHERE id = exhibition_id AND created_by = auth.uid()) OR public.is_admin_user()
);
