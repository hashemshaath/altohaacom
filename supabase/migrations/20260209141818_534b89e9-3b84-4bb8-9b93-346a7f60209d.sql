
-- Create storage bucket for competition images
INSERT INTO storage.buckets (id, name, public) VALUES ('competition-images', 'competition-images', true);

-- Allow anyone to view competition images
CREATE POLICY "Competition images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'competition-images');

-- Allow authenticated organizers to upload
CREATE POLICY "Organizers can upload competition images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'competition-images' AND auth.uid() IS NOT NULL);

-- Allow users to update their own uploads
CREATE POLICY "Users can update their competition images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'competition-images' AND auth.uid() IS NOT NULL);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their competition images"
ON storage.objects FOR DELETE
USING (bucket_id = 'competition-images' AND auth.uid() IS NOT NULL);
