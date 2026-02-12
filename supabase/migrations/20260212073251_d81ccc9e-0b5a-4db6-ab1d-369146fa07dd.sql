-- 1. Fix RLS: Allow admins (organizer/supervisor) to update ANY profile
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('organizer', 'supervisor')
  );
$$;

-- Drop the old restrictive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.is_admin_user());

-- 2. Add bilingual fields for SEO
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name_ar TEXT,
  ADD COLUMN IF NOT EXISTS display_name_ar TEXT,
  ADD COLUMN IF NOT EXISTS bio_ar TEXT,
  ADD COLUMN IF NOT EXISTS specialization_ar TEXT;
