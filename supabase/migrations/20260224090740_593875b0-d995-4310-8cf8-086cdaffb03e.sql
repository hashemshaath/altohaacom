
-- Add enrichment columns to exhibitions for comprehensive event data
ALTER TABLE public.exhibitions 
  ADD COLUMN IF NOT EXISTS edition_year INTEGER,
  ADD COLUMN IF NOT EXISTS series_id UUID,
  ADD COLUMN IF NOT EXISTS reasons_to_attend JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS unique_features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS targeted_sectors TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS edition_stats JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS entry_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS venue_details JSONB DEFAULT '{}'::jsonb;

-- Create exhibition_sponsors linking table to connect sponsors with platform entities
CREATE TABLE IF NOT EXISTS public.exhibition_sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  tier TEXT DEFAULT 'partner',
  logo_url TEXT,
  website_url TEXT,
  -- Link to platform entities (optional, for deduplication)
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  entity_id UUID REFERENCES public.culinary_entities(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create exhibition_organizers linking table for multiple organizers
CREATE TABLE IF NOT EXISTS public.exhibition_organizers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  role TEXT DEFAULT 'organizer',
  logo_url TEXT,
  website_url TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  entity_id UUID REFERENCES public.culinary_entities(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exhibition_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibition_organizers ENABLE ROW LEVEL SECURITY;

-- Public read for sponsors and organizers
CREATE POLICY "Exhibition sponsors are publicly readable" ON public.exhibition_sponsors FOR SELECT USING (true);
CREATE POLICY "Exhibition organizers are publicly readable" ON public.exhibition_organizers FOR SELECT USING (true);

-- Admin write for sponsors
CREATE POLICY "Admins can manage exhibition sponsors" ON public.exhibition_sponsors FOR ALL USING (public.is_admin_user());
CREATE POLICY "Admins can manage exhibition organizers" ON public.exhibition_organizers FOR ALL USING (public.is_admin_user());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exhibition_sponsors_exhibition ON public.exhibition_sponsors(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_organizers_exhibition ON public.exhibition_organizers(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_exhibitions_edition_year ON public.exhibitions(edition_year);
CREATE INDEX IF NOT EXISTS idx_exhibitions_series_id ON public.exhibitions(series_id);

COMMENT ON COLUMN public.exhibitions.reasons_to_attend IS 'JSON array: [{reason, reason_ar}]';
COMMENT ON COLUMN public.exhibitions.unique_features IS 'JSON array: [{feature, feature_ar, icon?}]';
COMMENT ON COLUMN public.exhibitions.edition_stats IS 'JSON: {exhibitors, visitors, countries, sessions, brands, etc}';
COMMENT ON COLUMN public.exhibitions.entry_details IS 'JSON: {type: free|paid|registration, ticket_types: [...], early_bird_price, etc}';
COMMENT ON COLUMN public.exhibitions.venue_details IS 'JSON: {capacity, halls, area_sqm, parking, accessibility, etc}';
