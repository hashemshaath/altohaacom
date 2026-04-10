-- Fix organizers policy - use created_by instead of user_id
DROP POLICY IF EXISTS "Active organizers are publicly readable" ON public.organizers;

CREATE POLICY "Active organizers are publicly readable"
  ON public.organizers FOR SELECT
  USING (
    (status = 'active' AND is_verified = true)
    OR is_admin(auth.uid())
    OR created_by = auth.uid()
  );
