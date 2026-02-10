
-- Fix overly permissive ALL policies by splitting into explicit operations

-- competition_types
DROP POLICY "Admins can manage competition types" ON public.competition_types;
CREATE POLICY "Admins can insert competition types" ON public.competition_types FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update competition types" ON public.competition_types FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete competition types" ON public.competition_types FOR DELETE USING (public.is_admin(auth.uid()));

-- competition_type_assignments
DROP POLICY "Admins can manage type assignments" ON public.competition_type_assignments;
CREATE POLICY "Admins can insert type assignments" ON public.competition_type_assignments FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update type assignments" ON public.competition_type_assignments FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete type assignments" ON public.competition_type_assignments FOR DELETE USING (public.is_admin(auth.uid()));

-- predefined_categories
DROP POLICY "Admins can manage predefined categories" ON public.predefined_categories;
CREATE POLICY "Admins can insert predefined categories" ON public.predefined_categories FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update predefined categories" ON public.predefined_categories FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete predefined categories" ON public.predefined_categories FOR DELETE USING (public.is_admin(auth.uid()));

-- competition_supervising_bodies
DROP POLICY "Admins can manage supervising bodies" ON public.competition_supervising_bodies;
CREATE POLICY "Admins can insert supervising bodies" ON public.competition_supervising_bodies FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update supervising bodies" ON public.competition_supervising_bodies FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete supervising bodies" ON public.competition_supervising_bodies FOR DELETE USING (public.is_admin(auth.uid()));

-- company_role_assignments
DROP POLICY "Admins can manage company roles" ON public.company_role_assignments;
CREATE POLICY "Admins can insert company roles" ON public.company_role_assignments FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update company roles" ON public.company_role_assignments FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete company roles" ON public.company_role_assignments FOR DELETE USING (public.is_admin(auth.uid()));
