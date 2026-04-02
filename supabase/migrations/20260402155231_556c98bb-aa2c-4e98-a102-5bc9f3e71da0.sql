-- Fix competition-images: DELETE policy - add ownership check
DROP POLICY IF EXISTS "Users can delete their competition images" ON storage.objects;
CREATE POLICY "Users can delete their competition images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'competition-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix competition-images: UPDATE policy - add ownership check
DROP POLICY IF EXISTS "Users can update their competition images" ON storage.objects;
CREATE POLICY "Users can update their competition images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'competition-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix competition-images: INSERT policy - add folder ownership check
DROP POLICY IF EXISTS "Organizers can upload competition images" ON storage.objects;
CREATE POLICY "Organizers can upload competition images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'competition-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix ad-creatives: UPDATE policy - add ownership check
DROP POLICY IF EXISTS "Users can update own ad creatives" ON storage.objects;
CREATE POLICY "Users can update own ad creatives"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ad-creatives'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix ad-creatives: INSERT policy - add ownership check
DROP POLICY IF EXISTS "Authenticated users upload ad creatives" ON storage.objects;
CREATE POLICY "Authenticated users upload ad creatives"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ad-creatives'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);