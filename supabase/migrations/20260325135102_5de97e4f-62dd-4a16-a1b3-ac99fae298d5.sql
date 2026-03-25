-- Align SEO admin data access with admin route permissions (supervisor, organizer, content_writer)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('supervisor', 'organizer', 'content_writer')
  );
$function$;

-- Competitors: currently supervisor-only, which breaks organizer/content_writer SEO access
DROP POLICY IF EXISTS "Admins manage seo_competitors" ON public.seo_competitors;
CREATE POLICY "Admins manage seo_competitors"
ON public.seo_competitors
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Backlinks: currently supervisor-only, which breaks organizer/content_writer SEO access
DROP POLICY IF EXISTS "Admins manage seo_backlinks" ON public.seo_backlinks;
CREATE POLICY "Admins manage seo_backlinks"
ON public.seo_backlinks
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());