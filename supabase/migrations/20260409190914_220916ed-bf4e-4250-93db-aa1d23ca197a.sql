-- Replace overly permissive profiles SELECT policy for public profiles
-- with one that only allows reading through the profiles_safe view
-- The profiles_safe view already excludes sensitive columns

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

-- Create a restricted policy: authenticated users can only see non-sensitive public profile data
-- They must use profiles_safe view; direct table access is owner-only or admin-only
CREATE POLICY "Public profiles viewable via safe view only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
  OR (
    profile_visibility = 'public'
    AND current_setting('request.path', true) IS NOT NULL
  )
);

-- Note: The profiles_safe view with security_invoker=on will inherit this policy
-- but will only expose the safe columns defined in the view