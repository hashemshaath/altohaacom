-- Add documents/brochures support to exhibitions
ALTER TABLE public.exhibitions 
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.exhibitions.documents IS 'Array of {name, name_ar, url, type} objects for downloadable files like brochures, floorplans, etc.';
