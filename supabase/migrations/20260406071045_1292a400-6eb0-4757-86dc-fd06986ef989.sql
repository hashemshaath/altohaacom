
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS edition_number integer;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS edition_number integer;
