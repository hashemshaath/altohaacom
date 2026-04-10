
-- 1. Drop the blanket public profiles SELECT policy
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

-- 2. Restrict competition_roles SELECT
DROP POLICY IF EXISTS "Anyone can view competition roles" ON public.competition_roles;
DROP POLICY IF EXISTS "Authenticated can view competition roles" ON public.competition_roles;

CREATE POLICY "Users view own or organizer competition roles"
ON public.competition_roles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = competition_roles.competition_id
    AND c.organizer_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);
