
-- Add location detail columns to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS neighborhood_ar text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS district_ar text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS google_maps_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS national_address text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS national_address_ar text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS street_ar text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS rating numeric;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS total_reviews integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS fax text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone_secondary text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS import_source text;
