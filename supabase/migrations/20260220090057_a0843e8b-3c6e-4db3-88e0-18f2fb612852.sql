
-- Fix 1: Restrict user_roles SELECT to owner or admin (prevents admin enumeration)
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
CREATE POLICY "Users can view own roles or admins can view all"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Fix 2: Restrict connections SELECT to involved parties or admin (privacy)
DROP POLICY IF EXISTS "Authenticated users can view connections" ON public.connections;
CREATE POLICY "Users can view own connections or admins can view all"
  ON public.connections
  FOR SELECT
  TO authenticated
  USING (follower_id = auth.uid() OR following_id = auth.uid() OR public.is_admin(auth.uid()));
