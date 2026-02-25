
-- Table to persist custom career sections per user
CREATE TABLE public.user_career_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section_key TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'FileText',
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'bg-chart-2/10 text-chart-2',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_key)
);

-- Enable RLS
ALTER TABLE public.user_career_sections ENABLE ROW LEVEL SECURITY;

-- Admins can manage all sections
CREATE POLICY "Admins can manage all career sections"
  ON public.user_career_sections FOR ALL
  USING (public.is_admin_user());

-- Users can view their own sections
CREATE POLICY "Users can view own career sections"
  ON public.user_career_sections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own sections
CREATE POLICY "Users can insert own career sections"
  ON public.user_career_sections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career sections"
  ON public.user_career_sections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own career sections"
  ON public.user_career_sections FOR DELETE
  USING (auth.uid() = user_id);
