
-- Make company-media bucket private
UPDATE storage.buckets SET public = false WHERE id = 'company-media';

-- Make exhibition-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'exhibition-files';
