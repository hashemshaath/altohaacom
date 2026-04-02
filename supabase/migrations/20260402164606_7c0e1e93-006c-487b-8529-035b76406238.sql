
-- Remove sensitive tables from realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'masterclass_enrollments') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.masterclass_enrollments;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'masterclass_lesson_progress') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.masterclass_lesson_progress;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'recipe_saves') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.recipe_saves;
  END IF;
END $$;
