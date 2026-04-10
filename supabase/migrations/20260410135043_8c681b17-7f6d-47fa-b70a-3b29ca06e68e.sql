
-- 1) requirement_lists: fix broken correlation
DROP POLICY IF EXISTS "Users can view assigned or shared lists" ON public.requirement_lists;
DROP POLICY IF EXISTS "Users can view their requirement lists" ON public.requirement_lists;

CREATE POLICY "Users can view their requirement lists"
ON public.requirement_lists FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.requirement_list_assignments rla
    WHERE rla.list_id = requirement_lists.id
    AND rla.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.requirement_list_shares rls
    WHERE rls.list_id = requirement_lists.id
    AND rls.shared_with_user_id = auth.uid()
  )
);

-- 2) user_titles
DROP POLICY IF EXISTS "Anyone can view public user titles" ON public.user_titles;
DROP POLICY IF EXISTS "Public can view titles of public profiles" ON public.user_titles;

CREATE POLICY "Public can view titles of public profiles"
ON public.user_titles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_titles.user_id
    AND p.profile_visibility = 'public'
  )
);

-- 3) user_affiliations
DROP POLICY IF EXISTS "Anyone can view public user affiliations" ON public.user_affiliations;
DROP POLICY IF EXISTS "Public can view affiliations of public profiles" ON public.user_affiliations;

CREATE POLICY "Public can view affiliations of public profiles"
ON public.user_affiliations FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_affiliations.user_id
    AND p.profile_visibility = 'public'
  )
);
