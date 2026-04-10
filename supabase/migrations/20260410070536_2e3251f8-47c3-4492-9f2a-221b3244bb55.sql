
-- 3. Fix exhibition_sponsor_applications: verify user belongs to company
DROP POLICY IF EXISTS "Authenticated users can submit own company applications" ON public.exhibition_sponsor_applications;
CREATE POLICY "Authenticated users can submit own company applications"
  ON public.exhibition_sponsor_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.company_contacts cc
      WHERE cc.company_id = exhibition_sponsor_applications.company_id
        AND cc.user_id = auth.uid()
    )
  );

-- 4. Fix profile_views
DROP POLICY IF EXISTS "Anyone can record profile views validated" ON public.profile_views;
CREATE POLICY "Anyone can record profile views validated"
  ON public.profile_views
  FOR INSERT
  TO public
  WITH CHECK (
    profile_user_id IS NOT NULL
    AND ((viewer_user_id IS NULL) OR (viewer_user_id = auth.uid()))
  );

-- 5. Fix recipe_shares
DROP POLICY IF EXISTS "Anyone can log a share validated" ON public.recipe_shares;
CREATE POLICY "Anyone can log a share validated"
  ON public.recipe_shares
  FOR INSERT
  TO public
  WITH CHECK (
    recipe_id IS NOT NULL
    AND ((user_id IS NULL) OR (user_id = auth.uid()))
  );
