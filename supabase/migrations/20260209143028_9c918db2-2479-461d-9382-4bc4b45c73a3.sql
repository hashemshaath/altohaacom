
-- Entity type enum
CREATE TYPE public.entity_type AS ENUM ('culinary_association', 'government_entity', 'private_association', 'culinary_academy', 'industry_body');

-- Entity scope enum
CREATE TYPE public.entity_scope AS ENUM ('local', 'national', 'regional', 'international');

-- Entity status enum  
CREATE TYPE public.entity_status AS ENUM ('pending', 'active', 'suspended', 'archived');

-- Main culinary entities table
CREATE TABLE public.culinary_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identity
  entity_number TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  
  -- Basic Info
  name TEXT NOT NULL,
  name_ar TEXT,
  abbreviation TEXT,
  abbreviation_ar TEXT,
  description TEXT,
  description_ar TEXT,
  
  -- Classification
  type public.entity_type NOT NULL,
  scope public.entity_scope NOT NULL DEFAULT 'local',
  status public.entity_status NOT NULL DEFAULT 'pending',
  is_visible BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Location
  country TEXT,
  city TEXT,
  address TEXT,
  address_ar TEXT,
  postal_code TEXT,
  
  -- Contact
  email TEXT,
  phone TEXT,
  fax TEXT,
  website TEXT,
  
  -- Social
  social_links JSONB DEFAULT '{}'::JSONB,
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}'::TEXT[],
  
  -- Leadership
  president_name TEXT,
  president_name_ar TEXT,
  secretary_name TEXT,
  secretary_name_ar TEXT,
  
  -- Details
  founded_year INTEGER,
  member_count INTEGER,
  mission TEXT,
  mission_ar TEXT,
  services TEXT[] DEFAULT '{}'::TEXT[],
  specializations TEXT[] DEFAULT '{}'::TEXT[],
  affiliated_organizations TEXT[] DEFAULT '{}'::TEXT[],
  
  -- Management
  account_manager_id UUID REFERENCES auth.users(id),
  internal_notes TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  
  -- Registration
  registration_number TEXT,
  license_number TEXT,
  registered_at TIMESTAMP WITH TIME ZONE,
  license_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.culinary_entities ENABLE ROW LEVEL SECURITY;

-- Public can view visible & active entities
CREATE POLICY "Anyone can view visible active entities"
ON public.culinary_entities FOR SELECT
USING (
  (is_visible = true AND status = 'active')
  OR is_admin(auth.uid())
  OR created_by = auth.uid()
);

-- Admins can manage all entities
CREATE POLICY "Admins can manage entities"
ON public.culinary_entities FOR ALL
USING (is_admin(auth.uid()));

-- Entity followers table
CREATE TABLE public.entity_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.culinary_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_id, user_id)
);

ALTER TABLE public.entity_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their entity follows"
ON public.entity_followers FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view entity follower counts"
ON public.entity_followers FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_culinary_entities_updated_at
BEFORE UPDATE ON public.culinary_entities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_culinary_entities_type ON public.culinary_entities(type);
CREATE INDEX idx_culinary_entities_scope ON public.culinary_entities(scope);
CREATE INDEX idx_culinary_entities_status ON public.culinary_entities(status);
CREATE INDEX idx_culinary_entities_country ON public.culinary_entities(country);
CREATE INDEX idx_culinary_entities_slug ON public.culinary_entities(slug);
CREATE INDEX idx_culinary_entities_username ON public.culinary_entities(username);

-- Sequence for entity numbers
CREATE SEQUENCE IF NOT EXISTS culinary_entity_seq START WITH 1;
