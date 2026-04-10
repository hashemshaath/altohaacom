
-- 1) Site settings: restrict write to super admin only
DROP POLICY IF EXISTS "PBAC: settings insert" ON public.site_settings;
DROP POLICY IF EXISTS "PBAC: settings update" ON public.site_settings;
DROP POLICY IF EXISTS "PBAC: settings delete" ON public.site_settings;

CREATE POLICY "Super admin can insert settings"
ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can update settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can delete settings"
ON public.site_settings FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

-- 2) Admin actions: restrict to super admin
DROP POLICY IF EXISTS "Admins can log actions" ON public.admin_actions;

CREATE POLICY "Super admins can log actions"
ON public.admin_actions FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- 3) User roles: ensure INSERT is super admin only (was missing WITH CHECK)
DROP POLICY IF EXISTS "Only supervisors can insert roles" ON public.user_roles;

CREATE POLICY "Only supervisors can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- 4) Create is_super_admin_user function for RLS without parameter
CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  );
$$;
