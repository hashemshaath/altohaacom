
-- Fix 1: Remove unrestricted INSERT policy on message-attachments bucket
DROP POLICY IF EXISTS "Authenticated users can upload message attachments" ON storage.objects;

-- Fix 2: Restrict competition_roles SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view competition roles" ON public.competition_roles;
CREATE POLICY "Authenticated users can view competition roles"
  ON public.competition_roles FOR SELECT TO authenticated USING (true);

-- Fix 3: Restrict company_role_assignments SELECT to authenticated users only  
DROP POLICY IF EXISTS "Anyone can view company role assignments" ON public.company_role_assignments;
CREATE POLICY "Authenticated users can view company role assignments"
  ON public.company_role_assignments FOR SELECT TO authenticated USING (true);
