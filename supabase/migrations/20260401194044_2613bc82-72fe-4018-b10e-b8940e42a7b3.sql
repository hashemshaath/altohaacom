CREATE OR REPLACE FUNCTION public.increment_exhibition_views(exhibition_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE exhibitions SET view_count = COALESCE(view_count, 0) + 1 WHERE id = exhibition_id;
$$;