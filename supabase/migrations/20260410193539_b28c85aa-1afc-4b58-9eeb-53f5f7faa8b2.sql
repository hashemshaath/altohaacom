-- Fix chef_establishment_qualifications
DROP POLICY IF EXISTS "Authenticated users can view qualifications" ON public.chef_establishment_qualifications;
CREATE POLICY "Owner or admin can view qualifications"
  ON public.chef_establishment_qualifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Fix chef_establishment_associations: remove public access
DROP POLICY IF EXISTS "Anyone can view associations" ON public.chef_establishment_associations;
CREATE POLICY "Owner or admin can view associations"
  ON public.chef_establishment_associations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));