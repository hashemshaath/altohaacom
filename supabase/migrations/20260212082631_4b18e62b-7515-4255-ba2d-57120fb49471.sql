
-- Career & Education history records (LinkedIn-style)
CREATE TABLE public.user_career_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('education', 'work')),
  
  -- Entity link (educational institution or workplace)
  entity_id UUID REFERENCES public.culinary_entities(id) ON DELETE SET NULL,
  entity_name TEXT, -- fallback if no entity linked
  
  -- Role / Position / Degree
  title TEXT NOT NULL, -- Job title or Degree name
  title_ar TEXT,
  
  -- Education-specific
  education_level TEXT, -- bachelors, masters, diploma, etc.
  field_of_study TEXT,
  field_of_study_ar TEXT,
  grade TEXT, -- GPA or grade
  
  -- Work-specific  
  department TEXT,
  department_ar TEXT,
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance', 'volunteer', NULL)),
  
  -- Period
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  
  -- Additional
  description TEXT,
  description_ar TEXT,
  location TEXT,
  
  -- Metadata
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_career_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own records
CREATE POLICY "Users can view own career records"
  ON public.user_career_records FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own records
CREATE POLICY "Users can insert own career records"
  ON public.user_career_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own records
CREATE POLICY "Users can update own career records"
  ON public.user_career_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own records
CREATE POLICY "Users can delete own career records"
  ON public.user_career_records FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all records
CREATE POLICY "Admins can view all career records"
  ON public.user_career_records FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert career records"
  ON public.user_career_records FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update career records"
  ON public.user_career_records FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete career records"
  ON public.user_career_records FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Public can view records (for public profiles)
CREATE POLICY "Public can view career records"
  ON public.user_career_records FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX idx_career_records_user_id ON public.user_career_records(user_id);
CREATE INDEX idx_career_records_type ON public.user_career_records(record_type);
CREATE INDEX idx_career_records_entity ON public.user_career_records(entity_id);

-- Trigger for updated_at
CREATE TRIGGER update_career_records_updated_at
  BEFORE UPDATE ON public.user_career_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
