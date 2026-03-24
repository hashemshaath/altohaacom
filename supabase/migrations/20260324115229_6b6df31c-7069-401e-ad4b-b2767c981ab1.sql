CREATE POLICY "Anonymous users can view public profiles"
ON public.profiles
FOR SELECT
TO anon
USING (profile_visibility <> 'private');