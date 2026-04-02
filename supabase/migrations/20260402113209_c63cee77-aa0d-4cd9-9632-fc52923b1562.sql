-- =============================================
-- FIX 1: user_roles — restrict INSERT to supervisors only
-- =============================================
DROP POLICY IF EXISTS "Users or admins can insert roles" ON public.user_roles;
CREATE POLICY "Only supervisors can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

-- Also restrict DELETE to supervisors
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only supervisors can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'supervisor'));

-- Tighten UPDATE to supervisor only (was is_admin which includes content_writer)
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only supervisors can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'supervisor'));

-- =============================================
-- FIX 2: entity_positions — restrict mutations to admins
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage entity positions" ON public.entity_positions;
CREATE POLICY "Only admins can insert entity positions"
  ON public.entity_positions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update entity positions" ON public.entity_positions;
CREATE POLICY "Only admins can update entity positions"
  ON public.entity_positions FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete entity positions" ON public.entity_positions;
CREATE POLICY "Only admins can delete entity positions"
  ON public.entity_positions FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));