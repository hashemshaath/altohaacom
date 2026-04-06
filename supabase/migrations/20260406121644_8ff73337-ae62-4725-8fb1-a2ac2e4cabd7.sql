
ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS region_ar text,
  ADD COLUMN IF NOT EXISTS floor_number text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS building_number text,
  ADD COLUMN IF NOT EXISTS additional_number text,
  ADD COLUMN IF NOT EXISTS unit_number text,
  ADD COLUMN IF NOT EXISTS short_address text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS region_ar text,
  ADD COLUMN IF NOT EXISTS floor_number text;

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS region_ar text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS district_ar text,
  ADD COLUMN IF NOT EXISTS building_number text,
  ADD COLUMN IF NOT EXISTS additional_number text,
  ADD COLUMN IF NOT EXISTS unit_number text,
  ADD COLUMN IF NOT EXISTS short_address text,
  ADD COLUMN IF NOT EXISTS floor_number text;

ALTER TABLE public.exhibitions
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS region_ar text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS district_ar text,
  ADD COLUMN IF NOT EXISTS building_number text,
  ADD COLUMN IF NOT EXISTS additional_number text,
  ADD COLUMN IF NOT EXISTS unit_number text,
  ADD COLUMN IF NOT EXISTS short_address text,
  ADD COLUMN IF NOT EXISTS floor_number text,
  ADD COLUMN IF NOT EXISTS postal_code text;
