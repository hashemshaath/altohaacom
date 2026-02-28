
-- Add size_sqm to exhibition_booths if not exists
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS size_sqm numeric DEFAULT 0;
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'open';
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS booked_by uuid;
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS booked_at timestamptz;
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS notes text;

-- Exhibition sponsor packages  
CREATE TABLE IF NOT EXISTS public.exhibition_sponsor_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id uuid NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  tier text DEFAULT 'partner',
  price numeric DEFAULT 0,
  currency text DEFAULT 'SAR',
  max_sponsors integer DEFAULT 5,
  benefits jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exhibition_sponsor_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view packages" ON public.exhibition_sponsor_packages FOR SELECT USING (true);
CREATE POLICY "Admins manage packages" ON public.exhibition_sponsor_packages FOR ALL USING (public.is_admin_user());

-- Attendee personal schedule
CREATE TABLE IF NOT EXISTS public.exhibition_attendee_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  exhibition_id uuid NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  schedule_item_id uuid REFERENCES exhibition_schedule_items(id) ON DELETE CASCADE,
  agenda_item_id uuid REFERENCES exhibition_agenda_items(id) ON DELETE CASCADE,
  booth_id uuid REFERENCES exhibition_booths(id) ON DELETE CASCADE,
  custom_title text,
  custom_title_ar text,
  custom_time timestamptz,
  custom_notes text,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, schedule_item_id),
  UNIQUE(user_id, agenda_item_id)
);
ALTER TABLE public.exhibition_attendee_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own schedule" ON public.exhibition_attendee_schedule FOR ALL USING (auth.uid() = user_id);

-- Sponsor applications
CREATE TABLE IF NOT EXISTS public.exhibition_sponsor_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id uuid NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  package_id uuid REFERENCES exhibition_sponsor_packages(id),
  company_id uuid REFERENCES companies(id),
  applicant_name text NOT NULL,
  applicant_email text,
  applicant_phone text,
  company_name text,
  company_name_ar text,
  logo_url text,
  website_url text,
  message text,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exhibition_sponsor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can apply" ON public.exhibition_sponsor_applications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users see own applications" ON public.exhibition_sponsor_applications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage applications" ON public.exhibition_sponsor_applications FOR ALL USING (public.is_admin_user());
