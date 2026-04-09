
-- 1. Secure view for judges excluding payment data
CREATE OR REPLACE VIEW public.competition_registrations_judge AS
SELECT 
  id, competition_id, participant_id, registration_number,
  dish_name, dish_description, dish_image_url,
  category_id, status, registered_at, approved_at,
  entry_type, team_name, team_name_ar,
  organization_id, organization_name, organization_name_ar, organization_type,
  notes
FROM public.competition_registrations;

GRANT SELECT ON public.competition_registrations_judge TO authenticated;

-- 2. Public profile SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (profile_visibility = 'public');
  END IF;
END $$;

-- 3. Fix company-media storage
DROP POLICY IF EXISTS "Public company media readable" ON storage.objects;

CREATE POLICY "Company media access control"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'company-media'
  AND (
    EXISTS (
      SELECT 1 FROM public.company_media cm
      WHERE cm.file_url LIKE '%' || storage.objects.name
      AND cm.is_public = true
    )
    OR EXISTS (
      SELECT 1 FROM public.company_media cm
      JOIN public.companies c ON c.id = cm.company_id
      WHERE cm.file_url LIKE '%' || storage.objects.name
      AND c.created_by = auth.uid()
    )
    OR public.is_admin_user()
  )
);

-- 4. Fix exhibition-files storage
DROP POLICY IF EXISTS "Anyone can view exhibition files" ON storage.objects;

CREATE POLICY "Exhibition files access control"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'exhibition-files'
  AND (
    EXISTS (
      SELECT 1 FROM public.exhibition_documents ed
      WHERE ed.file_url LIKE '%' || storage.objects.name
      AND ed.is_public = true
    )
    OR public.is_admin_user()
  )
);
