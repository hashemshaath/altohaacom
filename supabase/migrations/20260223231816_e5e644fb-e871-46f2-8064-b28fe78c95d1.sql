ALTER TABLE public.exhibitions ADD COLUMN import_source text;

ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS import_source text;