-- Create exhibition venues table
CREATE TABLE public.exhibition_venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  city TEXT,
  city_ar TEXT,
  country TEXT,
  address TEXT,
  address_ar TEXT,
  capacity INTEGER,
  logo_url TEXT,
  cover_image_url TEXT,
  map_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  description_ar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active venues"
  ON public.exhibition_venues FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert venues"
  ON public.exhibition_venues FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update venues"
  ON public.exhibition_venues FOR UPDATE
  TO authenticated USING (true);

-- Add venue_id to exhibitions
ALTER TABLE public.exhibitions
  ADD COLUMN venue_id UUID REFERENCES public.exhibition_venues(id);

CREATE INDEX idx_exhibitions_venue_id ON public.exhibitions(venue_id);

-- Prevent duplicate: same title + same year for non-cancelled events
CREATE UNIQUE INDEX idx_exhibitions_unique_title_year
  ON public.exhibitions (lower(title), edition_year)
  WHERE status NOT IN ('cancelled');

-- Trigger for updated_at
CREATE TRIGGER update_exhibition_venues_updated_at
  BEFORE UPDATE ON public.exhibition_venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();