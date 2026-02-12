-- Fix RLS: Allow admin users (organizer/supervisor roles) to see ALL competitions including drafts
DROP POLICY IF EXISTS "Anyone can view non-draft competitions" ON public.competitions;

CREATE POLICY "Anyone can view non-draft competitions or admins see all"
ON public.competitions
FOR SELECT
USING (
  (status <> 'draft'::competition_status)
  OR (organizer_id = auth.uid())
  OR (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('organizer'::app_role, 'supervisor'::app_role)
  ))
);