
-- Make message-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'message-attachments';

-- Add RLS policies for message-attachments
-- Any authenticated user can read message attachments (they must be logged in)
CREATE POLICY "Authenticated users can view message attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

-- Authenticated users can upload message attachments
CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);

-- Users can delete their own message attachments (by folder prefix)
CREATE POLICY "Users can delete own message attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'message-attachments' AND (
  auth.uid()::text = (storage.foldername(name))[1]
  OR is_admin(auth.uid())
));
