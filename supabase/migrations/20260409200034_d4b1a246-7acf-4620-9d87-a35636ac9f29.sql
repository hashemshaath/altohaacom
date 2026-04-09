-- Fix 1: Replace the overly permissive profiles SELECT policy
DROP POLICY IF EXISTS "Public profiles viewable via safe view only" ON public.profiles;

CREATE POLICY "Authenticated users view own or admin views all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
);

-- Fix 2: Restrict exhibition_volunteers SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view volunteers of exhibitions" ON public.exhibition_volunteers;

CREATE POLICY "Authenticated users can view volunteers"
ON public.exhibition_volunteers
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR is_exhibition_organizer(exhibition_id)
  OR is_admin_user()
);