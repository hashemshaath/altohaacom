
-- Fix the last USING(true) on password_reset_requests
DROP POLICY IF EXISTS "Authenticated users can manage own resets" ON public.password_reset_requests;

-- Users should only see/manage their own reset requests
-- The identifier column stores the email/phone used for the reset
CREATE POLICY "Users manage own password resets"
  ON public.password_reset_requests FOR ALL TO authenticated
  USING (identifier = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (identifier = (SELECT email FROM auth.users WHERE id = auth.uid()));
