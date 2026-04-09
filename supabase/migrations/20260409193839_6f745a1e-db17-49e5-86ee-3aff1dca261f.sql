
-- Fix article-images INSERT policy: add folder ownership
DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix shop-images INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload shop images" ON storage.objects;
CREATE POLICY "Authenticated users can upload shop images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix product-images INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix company-assets INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload company assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
