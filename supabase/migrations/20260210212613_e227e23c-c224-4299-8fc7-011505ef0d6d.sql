
-- 1. Add new entity types for educational institutions
ALTER TYPE public.entity_type ADD VALUE IF NOT EXISTS 'university';
ALTER TYPE public.entity_type ADD VALUE IF NOT EXISTS 'college';
ALTER TYPE public.entity_type ADD VALUE IF NOT EXISTS 'training_center';

-- 2. Entity Memberships: users belonging to entities
CREATE TABLE public.entity_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.culinary_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL DEFAULT 'member' CHECK (membership_type IN ('member', 'student', 'alumni', 'instructor', 'staff', 'board_member', 'honorary')),
  title TEXT,
  title_ar TEXT,
  department TEXT,
  department_ar TEXT,
  student_id TEXT,
  enrollment_date DATE,
  graduation_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired', 'suspended', 'graduated')),
  is_public BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, user_id, membership_type)
);

ALTER TABLE public.entity_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public memberships"
  ON public.entity_memberships FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own memberships"
  ON public.entity_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own memberships"
  ON public.entity_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships"
  ON public.entity_memberships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memberships"
  ON public.entity_memberships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships"
  ON public.entity_memberships FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_entity_memberships_updated_at
  BEFORE UPDATE ON public.entity_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Entity Programs: courses, degrees, training programs offered
CREATE TABLE public.entity_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.culinary_entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  program_type TEXT NOT NULL DEFAULT 'course' CHECK (program_type IN ('diploma', 'degree', 'certificate', 'course', 'workshop', 'bootcamp', 'apprenticeship')),
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'professional', 'bachelor', 'master', 'doctorate')),
  duration_months INTEGER,
  credits INTEGER,
  tuition_fee DECIMAL(10,2),
  currency TEXT DEFAULT 'SAR',
  language TEXT DEFAULT 'en',
  max_students INTEGER,
  prerequisites TEXT,
  prerequisites_ar TEXT,
  syllabus JSONB,
  schedule JSONB,
  start_date DATE,
  end_date DATE,
  enrollment_deadline DATE,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entity_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active programs"
  ON public.entity_programs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage programs"
  ON public.entity_programs FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_entity_programs_updated_at
  BEFORE UPDATE ON public.entity_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Program Enrollments: students enrolled in programs
CREATE TABLE public.entity_program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.entity_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('pending', 'enrolled', 'in_progress', 'completed', 'withdrawn', 'failed')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  grade TEXT,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, user_id)
);

ALTER TABLE public.entity_program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments"
  ON public.entity_program_enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves"
  ON public.entity_program_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON public.entity_program_enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all enrollments"
  ON public.entity_program_enrollments FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_entity_program_enrollments_updated_at
  BEFORE UPDATE ON public.entity_program_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Entity Degrees/Qualifications: degrees earned by users from entities
CREATE TABLE public.entity_degrees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.culinary_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.entity_programs(id) ON DELETE SET NULL,
  degree_name TEXT NOT NULL,
  degree_name_ar TEXT,
  degree_type TEXT NOT NULL CHECK (degree_type IN ('diploma', 'certificate', 'associate', 'bachelor', 'master', 'doctorate', 'professional_cert', 'workshop_cert')),
  field_of_study TEXT,
  field_of_study_ar TEXT,
  graduation_date DATE,
  issue_date DATE,
  certificate_number TEXT,
  gpa TEXT,
  honors TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  document_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entity_degrees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public degrees are viewable"
  ON public.entity_degrees FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own degrees"
  ON public.entity_degrees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own degrees"
  ON public.entity_degrees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own degrees"
  ON public.entity_degrees FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own degrees"
  ON public.entity_degrees FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all degrees"
  ON public.entity_degrees FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_entity_degrees_updated_at
  BEFORE UPDATE ON public.entity_degrees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Entity Events: events hosted by entities
CREATE TABLE public.entity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.culinary_entities(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  event_type TEXT NOT NULL DEFAULT 'general' CHECK (event_type IN ('competition', 'workshop', 'seminar', 'conference', 'exhibition', 'graduation', 'open_day', 'general')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  location_ar TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_url TEXT,
  max_attendees INTEGER,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are viewable"
  ON public.entity_events FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admins can manage events"
  ON public.entity_events FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_entity_events_updated_at
  BEFORE UPDATE ON public.entity_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Entity Event Attendees
CREATE TABLE public.entity_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.entity_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled', 'no_show')),
  registered_at TIMESTAMPTZ DEFAULT now(),
  attended_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.entity_event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance"
  ON public.entity_event_attendees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events"
  ON public.entity_event_attendees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
  ON public.entity_event_attendees FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all attendance"
  ON public.entity_event_attendees FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 8. Competition-Entity link: which entity's students participate in which competition
CREATE TABLE public.entity_competition_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.culinary_entities(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  participation_type TEXT NOT NULL DEFAULT 'participant' CHECK (participation_type IN ('participant', 'organizer', 'sponsor', 'host', 'partner')),
  student_count INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, competition_id, participation_type)
);

ALTER TABLE public.entity_competition_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participations"
  ON public.entity_competition_participations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage participations"
  ON public.entity_competition_participations FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));
