
-- 1. Add columns
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS organizer_number TEXT UNIQUE;
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS exhibition_number TEXT UNIQUE;
ALTER TABLE public.event_series ADD COLUMN IF NOT EXISTS series_number TEXT UNIQUE;
ALTER TABLE public.masterclasses ADD COLUMN IF NOT EXISTS masterclass_number TEXT UNIQUE;
ALTER TABLE public.masterclasses ADD COLUMN IF NOT EXISTS exhibition_id UUID REFERENCES public.exhibitions(id) ON DELETE SET NULL;
ALTER TABLE public.exhibition_organizers ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES public.organizers(id) ON DELETE SET NULL;

-- 2. Sequences
CREATE SEQUENCE IF NOT EXISTS public.organizer_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.exhibition_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.series_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.masterclass_number_seq START WITH 1;

-- 3. Generator functions
CREATE OR REPLACE FUNCTION public.generate_organizer_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN RETURN 'ORG' || LPAD(nextval('public.organizer_number_seq')::TEXT, 6, '0'); END; $$;

CREATE OR REPLACE FUNCTION public.generate_exhibition_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN RETURN 'EXH' || LPAD(nextval('public.exhibition_number_seq')::TEXT, 6, '0'); END; $$;

CREATE OR REPLACE FUNCTION public.generate_series_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN RETURN 'SER' || LPAD(nextval('public.series_number_seq')::TEXT, 6, '0'); END; $$;

CREATE OR REPLACE FUNCTION public.generate_masterclass_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN RETURN 'MCL' || LPAD(nextval('public.masterclass_number_seq')::TEXT, 6, '0'); END; $$;

-- 4. Trigger functions
CREATE OR REPLACE FUNCTION public.assign_organizer_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN IF NEW.organizer_number IS NULL OR NEW.organizer_number = '' THEN NEW.organizer_number := public.generate_organizer_number(); END IF; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.assign_exhibition_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN IF NEW.exhibition_number IS NULL OR NEW.exhibition_number = '' THEN NEW.exhibition_number := public.generate_exhibition_number(); END IF; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.assign_series_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN IF NEW.series_number IS NULL OR NEW.series_number = '' THEN NEW.series_number := public.generate_series_number(); END IF; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.assign_masterclass_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN IF NEW.masterclass_number IS NULL OR NEW.masterclass_number = '' THEN NEW.masterclass_number := public.generate_masterclass_number(); END IF; RETURN NEW; END; $$;

-- 5. Triggers
DROP TRIGGER IF EXISTS trg_assign_organizer_number ON public.organizers;
CREATE TRIGGER trg_assign_organizer_number BEFORE INSERT ON public.organizers FOR EACH ROW EXECUTE FUNCTION public.assign_organizer_number();

DROP TRIGGER IF EXISTS trg_assign_exhibition_number ON public.exhibitions;
CREATE TRIGGER trg_assign_exhibition_number BEFORE INSERT ON public.exhibitions FOR EACH ROW EXECUTE FUNCTION public.assign_exhibition_number();

DROP TRIGGER IF EXISTS trg_assign_series_number ON public.event_series;
CREATE TRIGGER trg_assign_series_number BEFORE INSERT ON public.event_series FOR EACH ROW EXECUTE FUNCTION public.assign_series_number();

DROP TRIGGER IF EXISTS trg_assign_masterclass_number ON public.masterclasses;
CREATE TRIGGER trg_assign_masterclass_number BEFORE INSERT ON public.masterclasses FOR EACH ROW EXECUTE FUNCTION public.assign_masterclass_number();

-- 6. Backfill existing records
WITH numbered AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM public.organizers WHERE organizer_number IS NULL)
UPDATE public.organizers o SET organizer_number = 'ORG' || LPAD(n.rn::TEXT, 6, '0') FROM numbered n WHERE o.id = n.id;

WITH numbered AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM public.exhibitions WHERE exhibition_number IS NULL)
UPDATE public.exhibitions e SET exhibition_number = 'EXH' || LPAD(n.rn::TEXT, 6, '0') FROM numbered n WHERE e.id = n.id;

WITH numbered AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM public.event_series WHERE series_number IS NULL)
UPDATE public.event_series s SET series_number = 'SER' || LPAD(n.rn::TEXT, 6, '0') FROM numbered n WHERE s.id = n.id;

WITH numbered AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM public.masterclasses WHERE masterclass_number IS NULL)
UPDATE public.masterclasses m SET masterclass_number = 'MCL' || LPAD(n.rn::TEXT, 6, '0') FROM numbered n WHERE m.id = n.id;

-- 7. Sync sequences
SELECT setval('public.organizer_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM public.organizers), 0), 1));
SELECT setval('public.exhibition_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM public.exhibitions), 0), 1));
SELECT setval('public.series_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM public.event_series), 0), 1));
SELECT setval('public.masterclass_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM public.masterclasses), 0), 1));

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_exhibition_organizers_organizer_id ON public.exhibition_organizers(organizer_id);
CREATE INDEX IF NOT EXISTS idx_masterclasses_exhibition_id ON public.masterclasses(exhibition_id);
