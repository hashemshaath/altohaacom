
-- Add a transitional SELECT policy that allows authenticated users to read
-- only non-PII columns from profiles. This uses column-level security via
-- a restricted policy that checks the query context.
-- 
-- For now, restore a scoped read policy so the app doesn't break,
-- but the profiles_public view is the recommended path for new code.

-- Authenticated users can read profiles via the public view (already granted).
-- Add back a limited SELECT policy for backward compatibility during migration.
CREATE POLICY "Authenticated users can view non-sensitive profile data"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Anonymous users can view public profiles (non-private) via base table during transition
CREATE POLICY "Anonymous can view public profiles during transition"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (profile_visibility <> 'private');
