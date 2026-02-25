-- Allow public profile pages to read career records for publicly visible profiles
DROP POLICY IF EXISTS "Public can view career records for public profiles" ON public.user_career_records;

CREATE POLICY "Public can view career records for public profiles"
ON public.user_career_records
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles_public pp
    WHERE pp.user_id = user_career_records.user_id
  )
);