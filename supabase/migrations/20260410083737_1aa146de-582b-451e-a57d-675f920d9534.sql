-- =========================================================
-- 1. FIX: Private/pending posts exposed via permissive OR
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view posts in public groups or personal feed" ON public.posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;

CREATE POLICY "Posts are viewable based on visibility rules"
  ON public.posts FOR SELECT
  USING (
    (group_id IS NULL AND visibility = 'public' AND moderation_status = 'approved')
    OR (group_id IS NOT NULL AND moderation_status = 'approved' AND EXISTS (
      SELECT 1 FROM public.groups WHERE groups.id = posts.group_id AND groups.is_private = false
    ))
    OR (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members WHERE group_members.group_id = posts.group_id AND group_members.user_id = auth.uid()
    ))
    OR (auth.uid() = author_id)
  );

-- =========================================================
-- 2. FIX: customer_groups readable by anon
-- =========================================================
DROP POLICY IF EXISTS "Anyone can read customer groups" ON public.customer_groups;

CREATE POLICY "Authenticated users can read customer groups"
  ON public.customer_groups FOR SELECT
  TO authenticated
  USING (true);

-- =========================================================
-- 3. FIX: user_affiliations readable by anon
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view affiliations" ON public.user_affiliations;

CREATE POLICY "Users can view own affiliations or public ones"
  ON public.user_affiliations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_affiliations.user_id
        AND profiles.profile_visibility = 'public'
    )
  );

-- =========================================================
-- 4. FIX: user_titles readable by anon
-- =========================================================
DROP POLICY IF EXISTS "Users can view all titles" ON public.user_titles;

CREATE POLICY "Users can view own titles or public ones"
  ON public.user_titles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_titles.user_id
        AND profiles.profile_visibility = 'public'
    )
  );