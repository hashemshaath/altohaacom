CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (profile_visibility = 'public' AND account_status = 'active');