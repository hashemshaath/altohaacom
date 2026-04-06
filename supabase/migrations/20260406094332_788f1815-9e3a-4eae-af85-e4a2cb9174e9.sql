ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS district_ar text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS street_ar text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS building_number text,
  ADD COLUMN IF NOT EXISTS additional_number text,
  ADD COLUMN IF NOT EXISTS national_address text,
  ADD COLUMN IF NOT EXISTS national_address_ar text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS google_maps_url text;