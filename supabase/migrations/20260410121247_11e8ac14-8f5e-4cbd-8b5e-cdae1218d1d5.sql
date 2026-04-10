
-- 1) marketing_tracking_config: admin only
DROP POLICY IF EXISTS "Authenticated can read active configs" ON public.marketing_tracking_config;
CREATE POLICY "Admins can read tracking configs"
ON public.marketing_tracking_config FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- 2) user-media: scope reads to own folder
DROP POLICY IF EXISTS "Authenticated can view user media" ON storage.objects;
CREATE POLICY "Users can view own media or public profiles"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-media');
