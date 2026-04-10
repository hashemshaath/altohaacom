
DROP POLICY IF EXISTS "Company contacts view company verification" ON public.verification_requests;
CREATE POLICY "Company contacts view company verification"
ON public.verification_requests FOR SELECT TO authenticated
USING (company_id IN (SELECT get_user_company_id(auth.uid())));
