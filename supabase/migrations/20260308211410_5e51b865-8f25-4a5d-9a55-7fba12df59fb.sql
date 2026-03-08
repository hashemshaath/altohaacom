
-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('article-images', 'article-images', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload article images
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'article-images');

-- Allow public read access to article images
CREATE POLICY "Public read access for article images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'article-images');

-- Allow owners to delete their article images
CREATE POLICY "Users can delete own article images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'article-images' AND (storage.foldername(name))[1] = auth.uid()::text);
