
DROP POLICY IF EXISTS "Users can insert own verification audit" ON public.verification_audit_log;

CREATE POLICY "Users can insert own verification audit"
ON public.verification_audit_log
FOR INSERT TO authenticated
WITH CHECK (action_by = auth.uid());
