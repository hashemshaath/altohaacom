
-- Create organizers table
CREATE TABLE public.organizers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ar TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[],
  
  -- Contact
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  address_ar TEXT,
  
  -- Location
  city TEXT,
  city_ar TEXT,
  country TEXT,
  country_ar TEXT,
  country_code CHAR(2),
  
  -- Social
  social_links JSONB DEFAULT '{}',
  
  -- Linked entities
  company_id UUID REFERENCES public.companies(id),
  entity_id UUID REFERENCES public.culinary_entities(id),
  
  -- Key people
  key_contacts JSONB DEFAULT '[]',
  
  -- Services & expertise
  services TEXT[],
  services_ar TEXT[],
  targeted_sectors TEXT[],
  categories TEXT[],
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Stats (denormalized for performance)
  total_exhibitions INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  
  -- Meta
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Organizers are publicly readable"
  ON public.organizers FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "Admins can manage organizers"
  ON public.organizers FOR ALL
  USING (public.is_admin(auth.uid()));

-- Link exhibitions to organizers
ALTER TABLE public.exhibitions
  ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES public.organizers(id);

-- Create index
CREATE INDEX idx_organizers_slug ON public.organizers(slug);
CREATE INDEX idx_organizers_status ON public.organizers(status);
CREATE INDEX idx_exhibitions_organizer_id ON public.exhibitions(organizer_id);
