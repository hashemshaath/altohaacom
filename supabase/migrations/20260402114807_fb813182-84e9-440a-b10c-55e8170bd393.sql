
-- Drop all existing SELECT policies on profiles to start clean
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view non-private profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anon and authenticated can view non-private profiles basic info" ON public.profiles;

-- Users see their own full profile
CREATE POLICY "Users can view own full profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins see all profiles  
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Public/anon can see non-private profiles (PII is stripped via profiles_public view)
CREATE POLICY "Anon can view non-private profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (profile_visibility IS DISTINCT FROM 'private');
