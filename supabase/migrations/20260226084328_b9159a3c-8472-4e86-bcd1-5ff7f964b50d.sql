
-- Allow authenticated users to view non-private profiles
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (profile_visibility <> 'private');
