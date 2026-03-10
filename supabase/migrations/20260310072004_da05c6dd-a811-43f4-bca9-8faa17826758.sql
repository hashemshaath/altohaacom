
-- 1) Add job availability columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_open_to_work boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS job_availability_visibility text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS preferred_job_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_work_locations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS salary_range_min integer DEFAULT null,
  ADD COLUMN IF NOT EXISTS salary_range_max integer DEFAULT null,
  ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS work_availability_note text DEFAULT null,
  ADD COLUMN IF NOT EXISTS work_availability_note_ar text DEFAULT null,
  ADD COLUMN IF NOT EXISTS willing_to_relocate boolean DEFAULT false;

-- 2) Create job_postings table
CREATE TABLE public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  posted_by uuid NOT NULL,
  title text NOT NULL,
  title_ar text,
  description text NOT NULL,
  description_ar text,
  job_type text NOT NULL DEFAULT 'full_time',
  experience_level text DEFAULT 'professional',
  specialization text,
  specialization_ar text,
  location text,
  location_ar text,
  country_code char(2),
  city text,
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'SAR',
  is_salary_visible boolean DEFAULT false,
  requirements text,
  requirements_ar text,
  benefits text,
  benefits_ar text,
  status text NOT NULL DEFAULT 'active',
  is_featured boolean DEFAULT false,
  application_deadline date,
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Public can view active job postings
CREATE POLICY "Anyone can view active job postings"
  ON public.job_postings FOR SELECT
  USING (status = 'active');

-- Company contacts can manage their job postings
CREATE POLICY "Company contacts can insert job postings"
  ON public.job_postings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.company_contacts WHERE company_id = job_postings.company_id AND user_id = auth.uid())
  );

CREATE POLICY "Company contacts can update job postings"
  ON public.job_postings FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.company_contacts WHERE company_id = job_postings.company_id AND user_id = auth.uid())
    OR public.is_admin_user()
  );

CREATE POLICY "Company contacts can delete job postings"
  ON public.job_postings FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.company_contacts WHERE company_id = job_postings.company_id AND user_id = auth.uid())
    OR public.is_admin_user()
  );

-- 3) Create job_applications table
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  cover_letter text,
  resume_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid,
  reviewer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, user_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Company contacts can view applications for their postings
CREATE POLICY "Company contacts can view applications for their jobs"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      JOIN public.company_contacts cc ON cc.company_id = jp.company_id
      WHERE jp.id = job_applications.job_id AND cc.user_id = auth.uid()
    )
    OR public.is_admin_user()
  );

-- Authenticated users can apply
CREATE POLICY "Users can insert own applications"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending applications"
  ON public.job_applications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Company contacts can update application status
CREATE POLICY "Company contacts can update application status"
  ON public.job_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      JOIN public.company_contacts cc ON cc.company_id = jp.company_id
      WHERE jp.id = job_applications.job_id AND cc.user_id = auth.uid()
    )
    OR public.is_admin_user()
  );

-- 4) Add profiles_public view update to expose open_to_work
-- We need to check if profiles_public is a view
