-- ============================================================
-- 1. tsvector columns + triggers + GIN indexes
-- ============================================================

-- ── recipes ──
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE OR REPLACE FUNCTION public.recipes_search_vector_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title,'') || ' ' || coalesce(NEW.title_ar,'') || ' ' ||
    coalesce(NEW.description,'') || ' ' || coalesce(NEW.description_ar,'') || ' ' ||
    coalesce(NEW.category,'')
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS recipes_search_vector_trg ON public.recipes;
CREATE TRIGGER recipes_search_vector_trg
BEFORE INSERT OR UPDATE OF title, title_ar, description, description_ar, category
ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.recipes_search_vector_update();
UPDATE public.recipes SET search_vector = to_tsvector('simple',
  coalesce(title,'') || ' ' || coalesce(title_ar,'') || ' ' ||
  coalesce(description,'') || ' ' || coalesce(description_ar,'') || ' ' ||
  coalesce(category,'')
) WHERE search_vector IS NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_search ON public.recipes USING gin(search_vector);

-- ── competitions ──
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE OR REPLACE FUNCTION public.competitions_search_vector_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title,'') || ' ' || coalesce(NEW.title_ar,'') || ' ' ||
    coalesce(NEW.description,'') || ' ' || coalesce(NEW.description_ar,'') || ' ' ||
    coalesce(NEW.venue,'') || ' ' || coalesce(NEW.venue_ar,'') || ' ' ||
    coalesce(NEW.city,'') || ' ' || coalesce(NEW.country,'')
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS competitions_search_vector_trg ON public.competitions;
CREATE TRIGGER competitions_search_vector_trg
BEFORE INSERT OR UPDATE OF title, title_ar, description, description_ar, venue, venue_ar, city, country
ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.competitions_search_vector_update();
UPDATE public.competitions SET search_vector = to_tsvector('simple',
  coalesce(title,'') || ' ' || coalesce(title_ar,'') || ' ' ||
  coalesce(description,'') || ' ' || coalesce(description_ar,'') || ' ' ||
  coalesce(venue,'') || ' ' || coalesce(venue_ar,'') || ' ' ||
  coalesce(city,'') || ' ' || coalesce(country,'')
) WHERE search_vector IS NULL;
CREATE INDEX IF NOT EXISTS idx_competitions_search ON public.competitions USING gin(search_vector);

-- ── articles ──
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE OR REPLACE FUNCTION public.articles_search_vector_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title,'') || ' ' || coalesce(NEW.title_ar,'') || ' ' ||
    coalesce(NEW.excerpt,'') || ' ' || coalesce(NEW.excerpt_ar,'') || ' ' ||
    coalesce(NEW.content,'') || ' ' || coalesce(NEW.content_ar,'')
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS articles_search_vector_trg ON public.articles;
CREATE TRIGGER articles_search_vector_trg
BEFORE INSERT OR UPDATE OF title, title_ar, excerpt, excerpt_ar, content, content_ar
ON public.articles FOR EACH ROW EXECUTE FUNCTION public.articles_search_vector_update();
UPDATE public.articles SET search_vector = to_tsvector('simple',
  coalesce(title,'') || ' ' || coalesce(title_ar,'') || ' ' ||
  coalesce(excerpt,'') || ' ' || coalesce(excerpt_ar,'') || ' ' ||
  coalesce(content,'') || ' ' || coalesce(content_ar,'')
) WHERE search_vector IS NULL;
CREATE INDEX IF NOT EXISTS idx_articles_search ON public.articles USING gin(search_vector);

-- ── profiles ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE OR REPLACE FUNCTION public.profiles_search_vector_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.full_name,'') || ' ' || coalesce(NEW.full_name_ar,'') || ' ' ||
    coalesce(NEW.display_name,'') || ' ' || coalesce(NEW.display_name_ar,'') || ' ' ||
    coalesce(NEW.username,'') || ' ' ||
    coalesce(NEW.bio,'') || ' ' || coalesce(NEW.bio_ar,'') || ' ' ||
    coalesce(NEW.specialization,'') || ' ' || coalesce(NEW.specialization_ar,'') || ' ' ||
    coalesce(NEW.location,'')
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_search_vector_trg ON public.profiles;
CREATE TRIGGER profiles_search_vector_trg
BEFORE INSERT OR UPDATE OF full_name, full_name_ar, display_name, display_name_ar, username, bio, bio_ar, specialization, specialization_ar, location
ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_search_vector_update();
UPDATE public.profiles SET search_vector = to_tsvector('simple',
  coalesce(full_name,'') || ' ' || coalesce(full_name_ar,'') || ' ' ||
  coalesce(display_name,'') || ' ' || coalesce(display_name_ar,'') || ' ' ||
  coalesce(username,'') || ' ' ||
  coalesce(bio,'') || ' ' || coalesce(bio_ar,'') || ' ' ||
  coalesce(specialization,'') || ' ' || coalesce(specialization_ar,'') || ' ' ||
  coalesce(location,'')
) WHERE search_vector IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles USING gin(search_vector);

-- ── exhibitions ──
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE OR REPLACE FUNCTION public.exhibitions_search_vector_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title,'') || ' ' || coalesce(NEW.title_ar,'') || ' ' ||
    coalesce(NEW.description,'') || ' ' || coalesce(NEW.description_ar,'') || ' ' ||
    coalesce(NEW.venue,'') || ' ' || coalesce(NEW.venue_ar,'') || ' ' ||
    coalesce(NEW.city,'') || ' ' || coalesce(NEW.country,'')
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS exhibitions_search_vector_trg ON public.exhibitions;
CREATE TRIGGER exhibitions_search_vector_trg
BEFORE INSERT OR UPDATE OF title, title_ar, description, description_ar, venue, venue_ar, city, country
ON public.exhibitions FOR EACH ROW EXECUTE FUNCTION public.exhibitions_search_vector_update();
UPDATE public.exhibitions SET search_vector = to_tsvector('simple',
  coalesce(title,'') || ' ' || coalesce(title_ar,'') || ' ' ||
  coalesce(description,'') || ' ' || coalesce(description_ar,'') || ' ' ||
  coalesce(venue,'') || ' ' || coalesce(venue_ar,'') || ' ' ||
  coalesce(city,'') || ' ' || coalesce(country,'')
) WHERE search_vector IS NULL;
CREATE INDEX IF NOT EXISTS idx_exhibitions_search ON public.exhibitions USING gin(search_vector);

-- ── culinary_entities ──
ALTER TABLE public.culinary_entities ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE OR REPLACE FUNCTION public.culinary_entities_search_vector_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.name,'') || ' ' || coalesce(NEW.name_ar,'') || ' ' ||
    coalesce(NEW.description,'') || ' ' || coalesce(NEW.description_ar,'') || ' ' ||
    coalesce(NEW.city,'') || ' ' || coalesce(NEW.country,'')
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS culinary_entities_search_vector_trg ON public.culinary_entities;
CREATE TRIGGER culinary_entities_search_vector_trg
BEFORE INSERT OR UPDATE OF name, name_ar, description, description_ar, city, country
ON public.culinary_entities FOR EACH ROW EXECUTE FUNCTION public.culinary_entities_search_vector_update();
UPDATE public.culinary_entities SET search_vector = to_tsvector('simple',
  coalesce(name,'') || ' ' || coalesce(name_ar,'') || ' ' ||
  coalesce(description,'') || ' ' || coalesce(description_ar,'') || ' ' ||
  coalesce(city,'') || ' ' || coalesce(country,'')
) WHERE search_vector IS NULL;
CREATE INDEX IF NOT EXISTS idx_culinary_entities_search ON public.culinary_entities USING gin(search_vector);

-- ============================================================
-- 2. search_logs — analytics for trending tags
-- ============================================================
CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query text NOT NULL,
  result_count integer NOT NULL DEFAULT 0,
  search_type text NOT NULL DEFAULT 'global',
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_query_lower ON public.search_logs (lower(query));

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert search logs" ON public.search_logs;
CREATE POLICY "Anyone can insert search logs"
ON public.search_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Supervisors can read search logs" ON public.search_logs;
CREATE POLICY "Supervisors can read search logs"
ON public.search_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'::public.app_role));