-- Add organizer reference columns and event content types
ALTER TABLE public.exhibitions
  ADD COLUMN IF NOT EXISTS organizer_type text DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS organizer_entity_id uuid REFERENCES public.culinary_entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organizer_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organizer_user_id uuid,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS includes_competitions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS includes_training boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS includes_seminars boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.exhibitions.organizer_type IS 'Type of organizer: entity, company, chef, or custom';
COMMENT ON COLUMN public.exhibitions.includes_competitions IS 'Whether this event includes culinary competitions';
COMMENT ON COLUMN public.exhibitions.includes_training IS 'Whether this event includes training workshops';
COMMENT ON COLUMN public.exhibitions.includes_seminars IS 'Whether this event includes culinary seminars';