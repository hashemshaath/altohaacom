-- Competition status enum
CREATE TYPE public.competition_status AS ENUM ('draft', 'upcoming', 'registration_open', 'registration_closed', 'in_progress', 'judging', 'completed', 'cancelled');

-- Competitions table
CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  cover_image_url TEXT,
  status competition_status NOT NULL DEFAULT 'draft',
  
  -- Dates
  registration_start TIMESTAMP WITH TIME ZONE,
  registration_end TIMESTAMP WITH TIME ZONE,
  competition_start TIMESTAMP WITH TIME ZONE NOT NULL,
  competition_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Location
  venue TEXT,
  venue_ar TEXT,
  city TEXT,
  country TEXT,
  is_virtual BOOLEAN DEFAULT false,
  
  -- Capacity
  max_participants INTEGER,
  
  -- Organizer
  organizer_id UUID NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Competition categories (e.g., Pastry, Main Course, etc.)
CREATE TABLE public.competition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  max_participants INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Judging criteria with weights
CREATE TABLE public.judging_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  max_score INTEGER NOT NULL DEFAULT 10,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Competition registrations
CREATE TABLE public.competition_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.competition_categories(id) ON DELETE SET NULL,
  participant_id UUID NOT NULL,
  
  -- Registration details
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, withdrawn
  registration_number TEXT,
  dish_name TEXT,
  dish_description TEXT,
  dish_image_url TEXT,
  
  -- Metadata
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  
  UNIQUE(competition_id, participant_id)
);

-- Judges assigned to competitions
CREATE TABLE public.competition_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  
  UNIQUE(competition_id, judge_id)
);

-- Scores given by judges
CREATE TABLE public.competition_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.competition_registrations(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES public.judging_criteria(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL,
  score DECIMAL(4,2) NOT NULL,
  notes TEXT,
  scored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(registration_id, criteria_id, judge_id)
);

-- Enable RLS on all tables
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judging_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitions
CREATE POLICY "Anyone can view non-draft competitions"
  ON public.competitions FOR SELECT
  USING (status != 'draft' OR organizer_id = auth.uid());

CREATE POLICY "Organizers can create competitions"
  ON public.competitions FOR INSERT
  WITH CHECK (
    auth.uid() = organizer_id AND 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('organizer', 'supervisor'))
  );

CREATE POLICY "Organizers can update their competitions"
  ON public.competitions FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their draft competitions"
  ON public.competitions FOR DELETE
  USING (auth.uid() = organizer_id AND status = 'draft');

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories"
  ON public.competition_categories FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage categories"
  ON public.competition_categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM competitions WHERE id = competition_id AND organizer_id = auth.uid())
  );

-- RLS Policies for judging criteria
CREATE POLICY "Anyone can view judging criteria"
  ON public.judging_criteria FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage judging criteria"
  ON public.judging_criteria FOR ALL
  USING (
    EXISTS (SELECT 1 FROM competitions WHERE id = competition_id AND organizer_id = auth.uid())
  );

-- RLS Policies for registrations
CREATE POLICY "Participants can view their own registrations"
  ON public.competition_registrations FOR SELECT
  USING (
    participant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM competitions WHERE id = competition_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM competition_judges WHERE competition_id = competition_registrations.competition_id AND judge_id = auth.uid())
  );

CREATE POLICY "Users can register for competitions"
  ON public.competition_registrations FOR INSERT
  WITH CHECK (auth.uid() = participant_id);

CREATE POLICY "Participants can update their registration"
  ON public.competition_registrations FOR UPDATE
  USING (participant_id = auth.uid() AND status IN ('pending', 'approved'));

CREATE POLICY "Participants can withdraw their registration"
  ON public.competition_registrations FOR DELETE
  USING (participant_id = auth.uid() AND status = 'pending');

-- RLS Policies for judges
CREATE POLICY "Anyone can view competition judges"
  ON public.competition_judges FOR SELECT
  USING (true);

CREATE POLICY "Organizers can assign judges"
  ON public.competition_judges FOR ALL
  USING (
    EXISTS (SELECT 1 FROM competitions WHERE id = competition_id AND organizer_id = auth.uid())
  );

-- RLS Policies for scores
CREATE POLICY "Judges can view scores they gave"
  ON public.competition_scores FOR SELECT
  USING (
    judge_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM competition_registrations cr
      JOIN competitions c ON c.id = cr.competition_id
      WHERE cr.id = registration_id AND (c.organizer_id = auth.uid() OR cr.participant_id = auth.uid())
    )
  );

CREATE POLICY "Judges can score registrations"
  ON public.competition_scores FOR INSERT
  WITH CHECK (
    auth.uid() = judge_id AND
    EXISTS (
      SELECT 1 FROM competition_judges cj
      JOIN competition_registrations cr ON cr.competition_id = cj.competition_id
      WHERE cj.judge_id = auth.uid() AND cr.id = registration_id
    )
  );

CREATE POLICY "Judges can update their scores"
  ON public.competition_scores FOR UPDATE
  USING (judge_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_competitions_status ON public.competitions(status);
CREATE INDEX idx_competitions_organizer ON public.competitions(organizer_id);
CREATE INDEX idx_registrations_competition ON public.competition_registrations(competition_id);
CREATE INDEX idx_registrations_participant ON public.competition_registrations(participant_id);
CREATE INDEX idx_scores_registration ON public.competition_scores(registration_id);
CREATE INDEX idx_scores_judge ON public.competition_scores(judge_id);