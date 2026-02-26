
-- Create event_series table for exhibition series management
CREATE TABLE public.event_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  series_type TEXT NOT NULL DEFAULT 'exhibition',
  is_active BOOLEAN NOT NULL DEFAULT true,
  default_venue TEXT,
  default_venue_ar TEXT,
  default_city TEXT,
  default_country TEXT,
  default_organizer_name TEXT,
  default_organizer_name_ar TEXT,
  default_organizer_email TEXT,
  default_organizer_phone TEXT,
  default_organizer_website TEXT,
  default_organizer_logo_url TEXT,
  cover_image_url TEXT,
  logo_url TEXT,
  website_url TEXT,
  tags TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;

-- Public read for active series
CREATE POLICY "Anyone can view active event series"
  ON public.event_series FOR SELECT
  USING (is_active = true);

-- Admins can manage series
CREATE POLICY "Admins can insert event series"
  ON public.event_series FOR INSERT
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update event series"
  ON public.event_series FOR UPDATE
  USING (public.is_admin_user());

CREATE POLICY "Admins can delete event series"
  ON public.event_series FOR DELETE
  USING (public.is_admin_user());

-- Add foreign key from exhibitions.series_id to event_series.id
ALTER TABLE public.exhibitions
  ADD CONSTRAINT exhibitions_series_id_fkey
  FOREIGN KEY (series_id) REFERENCES public.event_series(id)
  ON DELETE SET NULL;
