
-- Judge extended profiles table
CREATE TABLE public.judge_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Classification
  judge_title TEXT, -- e.g. "Senior International Judge", "Certified WACS Judge"
  judge_title_ar TEXT,
  judge_category TEXT, -- e.g. "culinary", "pastry", "beverage"
  judge_level TEXT, -- e.g. "national", "international", "master"
  nationality TEXT,
  second_nationality TEXT,
  country_of_residence TEXT,
  
  -- Personal Info
  full_name_ar TEXT,
  date_of_birth DATE,
  gender TEXT,
  marital_status TEXT,
  spouse_name TEXT,
  spouse_name_ar TEXT,
  spouse_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_type TEXT,
  
  -- Passport & ID
  passport_number TEXT,
  passport_country TEXT,
  passport_issue_date DATE,
  passport_expiry_date DATE,
  national_id TEXT,
  
  -- Professional
  current_position TEXT,
  current_employer TEXT,
  years_of_experience INTEGER,
  culinary_specialties TEXT[] DEFAULT '{}'::TEXT[],
  certifications TEXT[] DEFAULT '{}'::TEXT[],
  languages_spoken TEXT[] DEFAULT '{}'::TEXT[],
  education TEXT,
  education_ar TEXT,
  
  -- Dietary & Health
  dietary_restrictions TEXT,
  allergies TEXT,
  medical_notes TEXT,
  
  -- Travel
  shirt_size TEXT,
  preferred_airline TEXT,
  frequent_flyer_number TEXT,
  travel_notes TEXT,
  
  -- Preferences
  notes TEXT,
  internal_notes TEXT, -- admin only
  
  -- Metadata
  resume_url TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_profiles ENABLE ROW LEVEL SECURITY;

-- Judges can view/edit their own profile
CREATE POLICY "Judges can manage own profile"
ON public.judge_profiles FOR ALL
USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all judge profiles"
ON public.judge_profiles FOR ALL
USING (public.is_admin(auth.uid()));

-- Judge documents table
CREATE TABLE public.judge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL, -- 'passport', 'national_id', 'certification', 'resume', 'photo', 'other'
  title TEXT NOT NULL,
  title_ar TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  expiry_date DATE,
  notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can manage own documents"
ON public.judge_documents FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all judge documents"
ON public.judge_documents FOR ALL
USING (public.is_admin(auth.uid()));

-- Judge organization memberships
CREATE TABLE public.judge_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  organization_name TEXT NOT NULL,
  organization_name_ar TEXT,
  membership_type TEXT, -- 'member', 'board_member', 'president', 'advisor'
  membership_number TEXT,
  role_in_organization TEXT,
  role_in_organization_ar TEXT,
  joined_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can manage own memberships"
ON public.judge_memberships FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all judge memberships"
ON public.judge_memberships FOR ALL
USING (public.is_admin(auth.uid()));

-- Judge visit/participation logs
CREATE TABLE public.judge_visit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- 'competition', 'exhibition', 'conference', 'workshop', 'visit'
  event_name TEXT NOT NULL,
  event_name_ar TEXT,
  location TEXT,
  country TEXT,
  start_date DATE,
  end_date DATE,
  role_played TEXT, -- 'judge', 'speaker', 'trainer', 'attendee', 'organizer'
  competition_id UUID REFERENCES public.competitions(id),
  notes TEXT,
  achievements TEXT, -- e.g. "Best Judge Award"
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_visit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can manage own visit logs"
ON public.judge_visit_logs FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all visit logs"
ON public.judge_visit_logs FOR ALL
USING (public.is_admin(auth.uid()));

-- Triggers
CREATE TRIGGER update_judge_profiles_updated_at
BEFORE UPDATE ON public.judge_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_judge_documents_updated_at
BEFORE UPDATE ON public.judge_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_judge_memberships_updated_at
BEFORE UPDATE ON public.judge_memberships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_judge_visit_logs_updated_at
BEFORE UPDATE ON public.judge_visit_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_judge_profiles_user_id ON public.judge_profiles(user_id);
CREATE INDEX idx_judge_documents_user_id ON public.judge_documents(user_id);
CREATE INDEX idx_judge_memberships_user_id ON public.judge_memberships(user_id);
CREATE INDEX idx_judge_visit_logs_user_id ON public.judge_visit_logs(user_id);

-- Storage bucket for judge documents
INSERT INTO storage.buckets (id, name, public) VALUES ('judge-documents', 'judge-documents', false);

CREATE POLICY "Judges can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'judge-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Judges can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'judge-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));

CREATE POLICY "Judges can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'judge-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can manage all judge documents storage"
ON storage.objects FOR ALL
USING (bucket_id = 'judge-documents' AND public.is_admin(auth.uid()));
