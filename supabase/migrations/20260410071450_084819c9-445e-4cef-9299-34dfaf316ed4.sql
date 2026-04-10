
-- Fix profile_views: drop the old conflicting policy
DROP POLICY IF EXISTS "Anyone can record a profile view validated" ON public.profile_views;

-- Fix exhibition-files storage: restrict INSERT to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload exhibition files" ON storage.objects;
CREATE POLICY "Authenticated users can upload exhibition files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exhibition-files'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
