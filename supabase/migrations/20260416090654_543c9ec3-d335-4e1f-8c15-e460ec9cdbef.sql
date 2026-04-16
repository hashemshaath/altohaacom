CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'members', (SELECT count(*) FROM profiles WHERE account_status = 'active'),
    'competitions', (SELECT count(*) FROM competitions),
    'exhibitions', (SELECT count(*) FROM exhibitions),
    'organizers', (SELECT count(*) FROM organizers),
    'entities', (SELECT count(*) FROM culinary_entities WHERE status = 'active')
  );
$$;