
-- 1) conversations: fix column names
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- 2) companies: revoke financial columns from anon
REVOKE SELECT (credit_limit, on_time_delivery_rate) ON public.companies FROM anon;

-- 3) user-media: require authentication for viewing
DROP POLICY IF EXISTS "Public can view user media" ON storage.objects;
CREATE POLICY "Authenticated can view user media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-media');
