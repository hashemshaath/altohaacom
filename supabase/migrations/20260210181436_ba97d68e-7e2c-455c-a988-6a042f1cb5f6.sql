-- Add country_code to masterclasses for country-aware filtering
ALTER TABLE public.masterclasses 
ADD COLUMN IF NOT EXISTS country_code CHAR(2) REFERENCES public.countries(code);

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_masterclasses_country_code ON public.masterclasses(country_code);