
-- Remove anonymous access to profiles table
-- Public-facing features use SECURITY DEFINER functions (verify_certificate, get_profile_safe, etc.)
DROP POLICY IF EXISTS "Anonymous can view public profiles during transition" ON public.profiles;
