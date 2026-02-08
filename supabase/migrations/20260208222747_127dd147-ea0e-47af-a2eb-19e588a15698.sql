-- Create storage bucket for competition dish images
INSERT INTO storage.buckets (id, name, public)
VALUES ('dish-images', 'dish-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload dish images
CREATE POLICY "Users can upload dish images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dish-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view dish images (public bucket)
CREATE POLICY "Dish images are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'dish-images');

-- Allow users to update their own dish images
CREATE POLICY "Users can update their dish images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'dish-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own dish images
CREATE POLICY "Users can delete their dish images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'dish-images' AND auth.uid()::text = (storage.foldername(name))[1]);