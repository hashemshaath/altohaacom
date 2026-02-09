
-- Create exhibition status enum
CREATE TYPE public.exhibition_status AS ENUM ('draft', 'upcoming', 'active', 'completed', 'cancelled');

-- Create exhibition type enum
CREATE TYPE public.exhibition_type AS ENUM ('exhibition', 'conference', 'summit', 'workshop', 'food_festival', 'trade_show', 'competition_event');

-- Create exhibitions table
CREATE TABLE public.exhibitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ar TEXT,
  type public.exhibition_type NOT NULL DEFAULT 'exhibition',
  status public.exhibition_status NOT NULL DEFAULT 'draft',
  
  -- Dates
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  early_bird_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Location
  venue TEXT,
  venue_ar TEXT,
  city TEXT,
  country TEXT,
  address TEXT,
  address_ar TEXT,
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT,
  map_url TEXT,
  
  -- Media
  cover_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}'::TEXT[],
  logo_url TEXT,
  
  -- Details
  organizer_name TEXT,
  organizer_name_ar TEXT,
  organizer_website TEXT,
  organizer_email TEXT,
  organizer_phone TEXT,
  
  -- Content
  target_audience TEXT[] DEFAULT '{}'::TEXT[],
  sections JSONB DEFAULT '[]'::JSONB,
  schedule JSONB DEFAULT '[]'::JSONB,
  speakers JSONB DEFAULT '[]'::JSONB,
  sponsors_info JSONB DEFAULT '[]'::JSONB,
  
  -- Participation
  registration_url TEXT,
  ticket_price TEXT,
  ticket_price_ar TEXT,
  max_attendees INTEGER,
  is_free BOOLEAN DEFAULT false,
  
  -- SEO & Meta
  tags TEXT[] DEFAULT '{}'::TEXT[],
  website_url TEXT,
  social_links JSONB DEFAULT '{}'::JSONB,
  
  -- Tracking
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exhibitions ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-draft exhibitions
CREATE POLICY "Anyone can view published exhibitions"
ON public.exhibitions FOR SELECT
USING (status != 'draft' OR created_by = auth.uid() OR is_admin(auth.uid()));

-- Admins can manage all exhibitions
CREATE POLICY "Admins can manage exhibitions"
ON public.exhibitions FOR ALL
USING (is_admin(auth.uid()));

-- Create exhibition followers table for notifications
CREATE TABLE public.exhibition_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_updates BOOLEAN DEFAULT true,
  notify_schedule BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exhibition_id, user_id)
);

ALTER TABLE public.exhibition_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their follows"
ON public.exhibition_followers FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view follower counts"
ON public.exhibition_followers FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_exhibitions_updated_at
BEFORE UPDATE ON public.exhibitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_exhibitions_status ON public.exhibitions(status);
CREATE INDEX idx_exhibitions_start_date ON public.exhibitions(start_date);
CREATE INDEX idx_exhibitions_slug ON public.exhibitions(slug);
