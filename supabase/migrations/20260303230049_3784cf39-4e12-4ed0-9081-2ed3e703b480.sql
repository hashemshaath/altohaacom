
-- ===== ADD COLUMNS =====
ALTER TABLE public.points_ledger ADD COLUMN IF NOT EXISTS ledger_number TEXT UNIQUE;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS recipe_number TEXT UNIQUE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS post_number TEXT UNIQUE;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS establishment_number TEXT UNIQUE;
ALTER TABLE public.global_events ADD COLUMN IF NOT EXISTS event_number TEXT UNIQUE;
ALTER TABLE public.masterclass_enrollments ADD COLUMN IF NOT EXISTS enrollment_number TEXT UNIQUE;
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS session_number TEXT UNIQUE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_number TEXT UNIQUE;
ALTER TABLE public.exhibition_reviews ADD COLUMN IF NOT EXISTS review_number TEXT UNIQUE;
ALTER TABLE public.recipe_reviews ADD COLUMN IF NOT EXISTS review_number TEXT UNIQUE;
ALTER TABLE public.supplier_reviews ADD COLUMN IF NOT EXISTS review_number TEXT UNIQUE;

-- ===== SEQUENCES =====
CREATE SEQUENCE IF NOT EXISTS public.ledger_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.recipe_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.post_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.establishment_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.event_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.enrollment_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.live_session_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.exh_review_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.recipe_review_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.supplier_review_number_seq START WITH 1;

-- ===== GENERATORS =====
CREATE OR REPLACE FUNCTION public.gen_ledger_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'PNT' || LPAD(nextval('ledger_number_seq')::TEXT, 8, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_recipe_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'RCP' || LPAD(nextval('recipe_number_seq')::TEXT, 6, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_post_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'PST' || LPAD(nextval('post_number_seq')::TEXT, 8, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_establishment_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'EST' || LPAD(nextval('establishment_number_seq')::TEXT, 6, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_event_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'EVT' || LPAD(nextval('event_number_seq')::TEXT, 6, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_enrollment_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'ENR' || LPAD(nextval('enrollment_number_seq')::TEXT, 8, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_live_session_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'LSN' || LPAD(nextval('live_session_number_seq')::TEXT, 6, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_booking_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'BKG' || LPAD(nextval('booking_number_seq')::TEXT, 8, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_exh_review_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'ERV' || LPAD(nextval('exh_review_number_seq')::TEXT, 8, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_recipe_review_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'RRV' || LPAD(nextval('recipe_review_number_seq')::TEXT, 8, '0'); END; $$;
CREATE OR REPLACE FUNCTION public.gen_supplier_review_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN 'SRV' || LPAD(nextval('supplier_review_number_seq')::TEXT, 8, '0'); END; $$;

-- ===== TRIGGER FUNCTIONS =====
CREATE OR REPLACE FUNCTION public.trg_fn_ledger_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.ledger_number IS NULL THEN NEW.ledger_number := gen_ledger_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_recipe_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.recipe_number IS NULL THEN NEW.recipe_number := gen_recipe_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_post_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.post_number IS NULL THEN NEW.post_number := gen_post_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_establishment_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.establishment_number IS NULL THEN NEW.establishment_number := gen_establishment_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_event_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.event_number IS NULL THEN NEW.event_number := gen_event_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_enrollment_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.enrollment_number IS NULL THEN NEW.enrollment_number := gen_enrollment_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_live_session_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.session_number IS NULL THEN NEW.session_number := gen_live_session_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_booking_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.booking_number IS NULL THEN NEW.booking_number := gen_booking_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_exh_review_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.review_number IS NULL THEN NEW.review_number := gen_exh_review_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_recipe_review_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.review_number IS NULL THEN NEW.review_number := gen_recipe_review_number(); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_fn_supplier_review_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN IF NEW.review_number IS NULL THEN NEW.review_number := gen_supplier_review_number(); END IF; RETURN NEW; END; $$;

-- ===== TRIGGERS =====
DROP TRIGGER IF EXISTS trg_ledger_number ON public.points_ledger; CREATE TRIGGER trg_ledger_number BEFORE INSERT ON public.points_ledger FOR EACH ROW EXECUTE FUNCTION trg_fn_ledger_number();
DROP TRIGGER IF EXISTS trg_recipe_number ON public.recipes; CREATE TRIGGER trg_recipe_number BEFORE INSERT ON public.recipes FOR EACH ROW EXECUTE FUNCTION trg_fn_recipe_number();
DROP TRIGGER IF EXISTS trg_post_number ON public.posts; CREATE TRIGGER trg_post_number BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION trg_fn_post_number();
DROP TRIGGER IF EXISTS trg_establishment_number ON public.establishments; CREATE TRIGGER trg_establishment_number BEFORE INSERT ON public.establishments FOR EACH ROW EXECUTE FUNCTION trg_fn_establishment_number();
DROP TRIGGER IF EXISTS trg_event_number ON public.global_events; CREATE TRIGGER trg_event_number BEFORE INSERT ON public.global_events FOR EACH ROW EXECUTE FUNCTION trg_fn_event_number();
DROP TRIGGER IF EXISTS trg_enrollment_number ON public.masterclass_enrollments; CREATE TRIGGER trg_enrollment_number BEFORE INSERT ON public.masterclass_enrollments FOR EACH ROW EXECUTE FUNCTION trg_fn_enrollment_number();
DROP TRIGGER IF EXISTS trg_live_session_number ON public.live_sessions; CREATE TRIGGER trg_live_session_number BEFORE INSERT ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION trg_fn_live_session_number();
DROP TRIGGER IF EXISTS trg_booking_number ON public.bookings; CREATE TRIGGER trg_booking_number BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION trg_fn_booking_number();
DROP TRIGGER IF EXISTS trg_exh_review_number ON public.exhibition_reviews; CREATE TRIGGER trg_exh_review_number BEFORE INSERT ON public.exhibition_reviews FOR EACH ROW EXECUTE FUNCTION trg_fn_exh_review_number();
DROP TRIGGER IF EXISTS trg_recipe_review_number ON public.recipe_reviews; CREATE TRIGGER trg_recipe_review_number BEFORE INSERT ON public.recipe_reviews FOR EACH ROW EXECUTE FUNCTION trg_fn_recipe_review_number();
DROP TRIGGER IF EXISTS trg_supplier_review_number ON public.supplier_reviews; CREATE TRIGGER trg_supplier_review_number BEFORE INSERT ON public.supplier_reviews FOR EACH ROW EXECUTE FUNCTION trg_fn_supplier_review_number();
