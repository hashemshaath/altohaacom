
-- Clean up certificate policies - drop ALL existing ones first
DROP POLICY IF EXISTS "Public can verify certificates by code" ON public.certificates;
DROP POLICY IF EXISTS "Public can view non-sensitive certificate data" ON public.certificates;
DROP POLICY IF EXISTS "Recipients can view their certificates" ON public.certificates;
DROP POLICY IF EXISTS "Recipients can view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON public.certificates;

-- Recreate: Admin full access
CREATE POLICY "Admins can manage certificates"
ON public.certificates FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Recreate: Recipients read their own
CREATE POLICY "Recipients can view own certificates"
ON public.certificates FOR SELECT TO authenticated
USING (recipient_id = auth.uid());

-- NO public/anon SELECT policy - public verification goes through get_public_certificate() function

-- Fix 4: get_user_chat_group_ids - add caller check
CREATE OR REPLACE FUNCTION public.get_user_chat_group_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN;
  END IF;
  RETURN QUERY SELECT group_id FROM chat_group_members WHERE user_id = p_user_id;
END;
$$;
