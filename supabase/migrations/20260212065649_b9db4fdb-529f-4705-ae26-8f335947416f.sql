-- Create user-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-media', 'user-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own media
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own media
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own media
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to user media
CREATE POLICY "Public can view user media"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-media');

-- Admin can upload media for any user
CREATE POLICY "Admins can upload user media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-media' 
  AND public.is_admin(auth.uid())
);

-- Admin can update media for any user
CREATE POLICY "Admins can update user media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-media' 
  AND public.is_admin(auth.uid())
);

-- Admin can delete media for any user
CREATE POLICY "Admins can delete user media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-media' 
  AND public.is_admin(auth.uid())
);

-- Add cover_image_url to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'cover_image_url' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cover_image_url TEXT;
  END IF;
END $$;